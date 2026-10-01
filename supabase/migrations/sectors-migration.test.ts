import { beforeAll, afterAll, it, expect } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { getSector, sectorPattern, sectorExactPattern } from '../../src/lib/sectors/catalog'
const db = new PGlite()
const user = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
let source: string
const migration = readFileSync(new URL('./202610010003_thematic_pages.sql', import.meta.url), 'utf8')
beforeAll(async () => {
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create table auth.users(id uuid primary key);
    create table sources(id uuid primary key default gen_random_uuid(),user_id uuid,name text,priority integer default 3,is_active boolean default true);
    create table articles(id uuid primary key default gen_random_uuid(),source_id uuid,title text,url text,excerpt text,image_url text,article_content text,published_at timestamptz,created_at timestamptz default now(),duplicate_of uuid);
    insert into auth.users values('${user}'),('${other}');`)
  await db.exec(migration)
  source = (await db.query<{ id: string }>('insert into sources(user_id,name) values($1,$2) returning id', [user, 'Test'])).rows[0].id
  await db.query("insert into articles(source_id,title,url,published_at) values($1,'OpenAI porta ChatGPT nei videogiochi','https://test/a',now()),($1,'Il Comune risponde ai cittadini','https://test/b',now()),($1,'ChatGPT notizia futura','https://test/c',now()+interval '1 day'),($1,'ChatGPT notizia vecchia','https://test/d',now()-interval '40 days')", [source])
}, 30000)
afterAll(() => db.close())
async function feed(sector: string, owner = user, offset = 0, limit = 50, since: string | null = null) {
  return (await db.query<{ data: { articles: { title: string }[]; total: number } }>('select athena_sector_feed($1,$2,$3,$4,$5,$6,$7,$8) as data', [owner, sectorPattern(getSector(sector)!), '', null, since, offset, limit, sectorExactPattern(getSector(sector)!)])).rows[0].data
}
it('classifies multilingual articles into overlapping sectors and excludes prepositions/future news', async () => {
  expect((await feed('ia')).total).toBe(2)
  expect((await feed('videogiochi')).articles[0].title).toBe('OpenAI porta ChatGPT nei videogiochi')
  expect((await feed('ia', other)).total).toBe(0)
})
it('paginates the entire archive in date order and honors the date filter', async () => {
  expect((await feed('ia', user, 0, 1)).articles[0].title).toBe('OpenAI porta ChatGPT nei videogiochi')
  expect((await feed('ia', user, 1, 1)).articles[0].title).toBe('ChatGPT notizia vecchia')
  expect((await feed('ia', user, 0, 50, new Date(Date.now() - 86400000).toISOString())).total).toBe(1)
})
it('is idempotent, locks duplicate running generations and denies public database access', async () => {
  await db.exec(migration)
  await db.query("insert into sector_curations(user_id,sector,status) values($1,'ia','running')", [user])
  await expect(db.query("insert into sector_curations(user_id,sector,status) values($1,'ia','running')", [user])).rejects.toThrow()
  expect((await db.query<{ allowed: boolean }>("select has_table_privilege('anon','sector_curations','select') as allowed")).rows[0].allowed).toBe(false)
  expect((await db.query<{ allowed: boolean }>("select has_function_privilege('authenticated','athena_sector_feed(uuid,text,text,uuid,timestamptz,integer,integer,text)','execute') as allowed")).rows[0].allowed).toBe(false)
})
