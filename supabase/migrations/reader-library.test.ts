import {afterAll,beforeAll,expect,it} from 'vitest'
import {PGlite} from '@electric-sql/pglite'
import {readFileSync} from 'node:fs'
const db=new PGlite();const user='00000000-0000-4000-8000-000000000001';const article='00000000-0000-4000-8000-000000000002'
beforeAll(async()=>{
 await db.exec(`create role anon; create role authenticated; create role service_role;create schema auth;create schema athena_private;create table athena_private.rss_requests(id integer); create table auth.users(id uuid primary key);create table articles(id uuid primary key);insert into auth.users values('${user}');insert into articles values('${article}');`)
 await db.exec(readFileSync(new URL('./202610030002_reader_library.sql',import.meta.url),'utf8'))
},30000)
afterAll(()=>db.close())
it('persists organization and allows restoring unread without deleting folders or tags',async()=>{
 await db.query("insert into article_library(user_id,article_id,read_at,folder,tags) values($1,$2,now(),'Tecnologia',array['IA'])",[user,article])
 await db.query('update article_library set read_at=null where user_id=$1 and article_id=$2',[user,article])
 expect((await db.query('select read_at,folder,tags from article_library')).rows).toEqual([{read_at:null,folder:'Tecnologia',tags:['IA']}])
 await expect(db.query("update article_library set folder=repeat('a',81)")).rejects.toThrow()
})
it('keeps reader and library inaccessible to browser database roles',async()=>{
 for(const role of ['anon','authenticated']) for(const table of ['article_library','reader_cache'])expect((await db.query<{allowed:boolean}>('select has_table_privilege($1,$2,\'select\') as allowed',[role,table])).rows[0].allowed).toBe(false)
 expect((await db.query<{enabled:boolean}>("select relrowsecurity as enabled from pg_class where oid='reader_cache'::regclass")).rows[0].enabled).toBe(true)
})
