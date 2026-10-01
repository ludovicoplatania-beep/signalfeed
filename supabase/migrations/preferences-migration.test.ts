import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
const db = new PGlite()
const owner = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
let source: string; let article: string; let alias: string
const migration = readFileSync(new URL('./202610010002_editorial_preferences.sql', import.meta.url), 'utf8')
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create table sources(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users,name text,website_url text,rss_url text,resolved_feed_url text,priority integer,is_active boolean default true);
    create table articles(id uuid primary key default gen_random_uuid(),source_id uuid references sources,title text,url text,excerpt text,image_url text,article_content text,published_at timestamptz,created_at timestamptz default now(),duplicate_of uuid references articles);
    insert into auth.users values('${owner}'),('${other}');`)
  await db.exec(migration)
  source = (await db.query<{ id: string }>("insert into sources(user_id,name,website_url,rss_url) values($1,'Fonte','https://publisher.test','https://publisher.test/feed') returning id", [owner])).rows[0].id
  article = (await db.query<{ id: string }>("insert into articles(source_id,title,url,published_at) values($1,'Prima notizia','https://publisher.test/first',now()) returning id", [source])).rows[0].id
  alias = (await db.query<{ id: string }>("insert into articles(source_id,title,url,duplicate_of,published_at) values($1,'Alias','https://publisher.test/first?utm_source=x',$2,now()) returning id", [source, article])).rows[0].id
}, 30_000)
afterAll(() => db.close())
describe('preferences migration in PostgreSQL', () => {
  it('can be applied twice and stores one current preference per canonical article', async () => {
    await db.exec(migration)
    await db.query('select athena_set_feedback($1,$2,$3)', [owner, alias, 'like'])
    await db.query('select athena_set_feedback($1,$2,$3)', [owner, article, 'less_topic'])
    expect((await db.query<{ article_id: string; preference: string }>('select article_id,preference from article_feedback')).rows).toEqual([{ article_id: article, preference: 'less_topic' }])
  })
  it('supports undo and rejects foreign-owner articles and invalid preferences', async () => {
    await db.query('select athena_set_feedback($1,$2,$3)', [owner, article, null])
    expect((await db.query<{ preference: null }>('select preference from article_feedback')).rows[0].preference).toBeNull()
    await expect(db.query('select athena_set_feedback($1,$2,$3)', [other, article, 'like'])).rejects.toThrow('Articolo non disponibile')
    await expect(db.query('select athena_set_feedback($1,$2,$3)', [owner, article, 'invalid'])).rejects.toThrow('Preferenza non valida')
  })
  it('makes adding the same verified feed idempotent', async () => {
    const insert = async () => (await db.query<{ id: string }>('select athena_add_verified_source($1,$2,$3,$4,$5) as id', [owner, 'Nuova', 'https://new.test', 'https://new.test/feed/', 3])).rows[0].id
    expect(await insert()).toBe(await insert())
  })
  it('balances prolific publishers, excludes future articles and keeps owner isolation', async () => {
    await db.query("insert into articles(source_id,title,url,published_at) select $1,'Notizia '||i,'https://publisher.test/'||i,now()-i*interval '1 minute' from generate_series(1,120) i", [source])
    const secondSource = (await db.query<{ id: string }>("select athena_add_verified_source($1,'Piccola','https://small.test','https://small.test/feed',3) as id", [owner])).rows[0].id
    await db.query("insert into articles(source_id,title,url,published_at) values($1,'Notizia piccola','https://small.test/a',now()-interval '2 days'),($1,'Futura','https://small.test/future',now()+interval '1 day')", [secondSource])
    const home = async (user: string) => (await db.query<{ articles: { title: string }[] }>('select athena_home_feed($1) as articles', [user])).rows[0].articles
    const result = await home(owner)
    expect(result).toHaveLength(100); expect(result.some(a => a.title === 'Notizia piccola')).toBe(true)
    expect(result.some(a => a.title === 'Futura')).toBe(false)
    expect(await home(other)).toEqual([])
  })
  it('keeps anonymous and authenticated database access closed', async () => {
    expect((await db.query<{ allowed: boolean }>("select has_function_privilege('anon','athena_set_feedback(uuid,uuid,text)','execute') as allowed")).rows[0].allowed).toBe(false)
    expect((await db.query<{ allowed: boolean }>("select has_table_privilege('authenticated','article_feedback','select') as allowed")).rows[0].allowed).toBe(false)
  })
})
