import {PGlite} from '@electric-sql/pglite'
import {readFileSync} from 'node:fs'
import {afterAll,beforeAll,expect,it} from 'vitest'
const db=new PGlite()
const owner='00000000-0000-4000-8000-000000000001', other='00000000-0000-4000-8000-000000000002'
const ids=['00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000014']
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create table sources(id uuid primary key,user_id uuid);create table articles(id uuid primary key,source_id uuid,duplicate_of uuid);insert into auth.users values('${owner}'),('${other}');insert into sources values('${owner}','${owner}'),('${other}','${other}');`)
 for(const [index,id] of ids.entries())await db.query('insert into articles values($1,$2,null)',[id,index===3?other:owner])
 await db.exec(readFileSync(new URL('./202610040001_events.sql',import.meta.url),'utf8'))
},30000)
afterAll(()=>db.close())
const member=(id:string,language='it')=>({article_id:id,language,focus:'Copertura'})
const upsert=(articles:ReturnType<typeof member>[])=>db.query<{result:{id:string;added:number}[]}>('select athena_upsert_events($1,$2::jsonb) as result',[owner,JSON.stringify([{title:'Evento',synopsis:'Fatto condiviso',articles}])])
it('keeps a stable event across refreshes, appends new coverage and is idempotent',async()=>{
 const first=(await upsert([member(ids[0]),member(ids[1],'en')])).rows[0].result[0]
 const second=(await upsert([member(ids[0]),member(ids[2])])).rows[0].result[0]
 expect(second.id).toBe(first.id);expect(second.added).toBe(1)
 expect((await upsert([member(ids[0]),member(ids[2])])).rows[0].result[0].added).toBe(0)
 expect((await db.query('select article_id,language from event_articles order by article_id')).rows).toEqual([{article_id:ids[0],language:'it'},{article_id:ids[1],language:'en'},{article_id:ids[2],language:'it'}])
 expect((await db.query('select * from news_events')).rows).toHaveLength(1)
})
it('rejects cross-owner articles atomically and denies browser database roles',async()=>{
 await expect(upsert([member(ids[0]),member(ids[3])])).rejects.toThrow('Invalid article ownership')
 for(const role of ['anon','authenticated'])for(const table of ['news_events','event_articles','event_primary_links'])expect((await db.query<{allowed:boolean}>("select has_table_privilege($1,$2,'select') as allowed",[role,table])).rows[0].allowed).toBe(false)
 expect((await db.query('select * from event_articles')).rows).toHaveLength(3)
})
