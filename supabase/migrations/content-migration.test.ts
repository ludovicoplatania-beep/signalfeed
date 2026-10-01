import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
const db = new PGlite()
const owner = '00000000-0000-4000-8000-000000000001'
const source = '00000000-0000-4000-8000-000000000002'
const first = '00000000-0000-4000-8000-000000000003'
const duplicate = '00000000-0000-4000-8000-000000000004'
const second = '00000000-0000-4000-8000-000000000005'
const migration = readFileSync(new URL('./202610010001_content_reliability.sql', import.meta.url), 'utf8')
const pick = (article_id = first, summary = 'Sintesi') => ({ article_id, score: 80, summary, reason: 'Motivo', category: 'Generale', selection_method: 'automatic' })
beforeAll(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create table sources(id uuid primary key, user_id uuid references auth.users, is_active boolean default true);
    create table articles(id uuid primary key default gen_random_uuid(), source_id uuid references sources, title text not null, url text not null, excerpt text, article_content text, published_at timestamptz, created_at timestamptz default now(), image_url text, hash text unique);
    create table ai_picks(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, article_id uuid references articles, score numeric not null check(score between 1 and 100), summary text, reason text, category text, created_at timestamptz default now(), unique(user_id, article_id));
    create table trending_topics(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, title text, description text, score numeric, articles jsonb, created_at timestamptz default now());
    create table saved_articles(user_id uuid references auth.users, article_id uuid references articles);
  `)
  await db.exec(migration)
  await db.exec(`insert into auth.users values('${owner}'); insert into sources values('${source}', '${owner}', true);
    insert into articles(id, source_id, title, url, hash) values
    ('${first}', '${source}', 'Originale', 'https://example.com/news', 'old1'),
    ('${duplicate}', '${source}', 'Titolo cambiato', 'https://example.com/news?utm_source=x', 'old2'),
    ('${second}', '${source}', 'Altra notizia', 'https://example.com/other', 'old3');
    insert into saved_articles values('${owner}', '${duplicate}');`)
}, 30_000)
afterAll(() => db.close())
describe('production migration in PostgreSQL', () => {
  it('can be applied twice without losing records', async () => {
    await db.exec(migration)
    const result = await db.query<{ count: number }>('select count(*)::integer as count from articles')
    expect(result.rows[0].count).toBe(3)
  })
  it('grants one lease across all update entrypoints', async () => {
    const a = await db.query<{ job: { claimed: boolean; job: { id: string } } }>('select athena_start_update($1, $2) as job', [owner, 'all'])
    const b = await db.query<{ job: { claimed: boolean; job: { id: string } } }>('select athena_start_update($1, $2) as job', [owner, 'rss'])
    expect(a.rows[0].job.claimed).toBe(true); expect(b.rows[0].job.claimed).toBe(false)
    expect(a.rows[0].job.job.id).toBe(b.rows[0].job.job.id)
  })
  it('recovers an interrupted lease', async () => {
    await db.exec("update athena_updates set updated_at = now() - interval '7 minutes'")
    const result = await db.query<{ job: { claimed: boolean } }>('select athena_start_update($1, $2) as job', [owner, 'ai'])
    expect(result.rows[0].job.claimed).toBe(true)
  })
  it('hides duplicate articles while retaining saves', async () => {
    await db.query('select athena_register_article($1, $2)', [first, 'https://example.com/news'])
    await db.query('select athena_register_article($1, $2)', [duplicate, 'https://example.com/news'])
    const result = await db.query<{ duplicate_of: string }>('select duplicate_of from articles where id = $1', [duplicate])
    expect(result.rows[0].duplicate_of).toBe(first)
    expect((await db.query('select * from saved_articles where article_id = $1', [duplicate])).rows).toHaveLength(1)
  })
  it('reuses historical picks with legacy unique constraints', async () => {
    await db.query('select athena_replace_picks($1, $2::jsonb)', [owner, JSON.stringify([pick()])])
    await db.query('select athena_replace_picks($1, $2::jsonb)', [owner, JSON.stringify([pick(first, 'Aggiornata')])])
    expect((await db.query<{ summary: string }>('select summary from ai_picks where is_current')).rows).toEqual([{ summary: 'Aggiornata' }])
  })
  it('preserves selections on empty output and failed replacement', async () => {
    await expect(db.query('select athena_replace_picks($1, $2::jsonb)', [owner, '[]'])).rejects.toThrow()
    await expect(db.query('select athena_replace_picks($1, $2::jsonb)', [owner, JSON.stringify([pick(second), { ...pick(first), score: 999 }])])).rejects.toThrow()
    expect((await db.query('select * from ai_picks where is_current')).rows).toHaveLength(1)
    expect((await db.query('select * from ai_picks where article_id = $1', [second])).rows).toHaveLength(0)
  })
  it('writes topics using the existing native articles type', async () => {
    const topic = [{ title: 'Tema', description: 'Descrizione', score: 70, articles: [first, second] }]
    await db.query('select athena_replace_topics($1, $2::jsonb)', [owner, JSON.stringify(topic)])
    await db.query('select athena_replace_topics($1, $2::jsonb)', [owner, JSON.stringify(topic)])
    expect((await db.query('select * from trending_topics where is_current')).rows).toHaveLength(1)
  })
  it('counts new, unchanged and updated articles atomically', async () => {
    const article = { canonical_url: 'https://example.com/new', title: 'Nuova', url: 'https://example.com/new', excerpt: 'Contenuto', article_content: 'Ricco', hash: 'new-hash' }
    const ingest = async (entry: object) => (await db.query<{ result: { newCount: number; updatedCount: number; unchangedCount: number } }>('select athena_ingest_articles($1, $2::jsonb) as result', [source, JSON.stringify([entry])])).rows[0].result
    expect((await ingest(article)).newCount).toBe(1)
    expect((await ingest(article)).unchangedCount).toBe(1)
    expect((await ingest({ ...article, title: 'Titolo corretto', article_content: null })).updatedCount).toBe(1)
    expect((await db.query<{ article_content: string }>("select article_content from articles where hash = 'new-hash'")).rows[0].article_content).toBe('Ricco')
  })
  it('does not expose privileged update RPCs to anonymous users', async () => {
    const result = await db.query<{ allowed: boolean }>("select has_function_privilege('anon', 'athena_start_update(uuid,text)', 'execute') as allowed")
    expect(result.rows[0].allowed).toBe(false)
  })
})
