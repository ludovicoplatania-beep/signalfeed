import {PGlite} from '@electric-sql/pglite'
import {readFileSync} from 'node:fs'
import {afterAll,beforeAll,expect,it} from 'vitest'
const db=new PGlite(),owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',source='00000000-0000-4000-8000-000000000003',article='00000000-0000-4000-8000-000000000004'
const backup={format:'athena-backup',version:1,exported_at:new Date().toISOString(),sources:[{key:source,name:'Test',rss_url:'https://example.com/rss',website_url:'https://example.com',priority:3,is_active:true}],interests:[{topic:'Test',score:80,origin:'manual',mode:'exclude',source_id:source}],budget:{enabled:true,monthly_limit_microusd:10000},alerts:null,articles:[{key:article,source_key:source,title:'News',url:'https://example.com/news',canonical_url:'https://example.com/news',excerpt:'Text',article_content:'Full body',published_at:null,image_url:null}],saved:[{article_key:article,created_at:'2026-10-01T00:00:00Z'}],library:[{article_key:article,read_at:'2026-10-01T01:00:00Z',folder:'IA',tags:['research']}],feedback:[{article_key:article,preference:'like'}],reader:[{article_key:article,body:'Full reader body',content_status:'full',checked_at:'2026-10-01T00:00:00Z'}]}
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);
 create table sources(id uuid primary key default gen_random_uuid(),user_id uuid,name text,website_url text,rss_url text,is_active boolean,priority integer);
 create table articles(id uuid primary key default gen_random_uuid(),source_id uuid references sources(id),title text,url text,excerpt text,article_content text,published_at timestamptz,image_url text,hash text,canonical_url text unique,created_at timestamptz default now());
 create table saved_articles(user_id uuid,article_id uuid references articles(id),created_at timestamptz default now(),primary key(user_id,article_id));
 create table user_interests(user_id uuid primary key,interests jsonb);create table article_library(user_id uuid,article_id uuid references articles(id),read_at timestamptz,folder text,tags text[],primary key(user_id,article_id));
 create table article_feedback(user_id uuid,article_id uuid references articles(id),preference text,title text,excerpt text,source_id uuid,source_name text,primary key(user_id,article_id));
 create table reader_cache(user_id uuid,article_id uuid references articles(id),body text,content_status text,checked_at timestamptz,primary key(user_id,article_id));
 create table alert_settings(user_id uuid primary key,enabled boolean,sectors text[],keywords text[],max_per_day integer,interval_minutes integer,quiet_start integer,quiet_end integer,timezone text);
 insert into auth.users values('${owner}'),('${other}');`)
 await db.exec(readFileSync(new URL('./202610040003_cost_portability.sql',import.meta.url),'utf8'))
},30000)
afterAll(()=>db.close())
const restore=(who:string,value:unknown,apply:boolean)=>db.query<{result:Record<string,number>}>('select athena_restore_backup($1,$2::jsonb,$3) result',[who,JSON.stringify(value),apply])
it('previews without writes and restores portable identifiers, texts and preferences',async()=>{
 expect((await restore(owner,backup,false)).rows[0].result).toMatchObject({sources:1,saved:1,reader:1})
 expect((await db.query('select * from sources')).rows).toHaveLength(0)
 await restore(owner,backup,true)
 const exported=(await db.query<{result:typeof backup}>('select athena_export_backup($1) result',[owner])).rows[0].result
 expect(exported.sources[0].key).not.toBe(source);expect(exported.sources[0].is_active).toBe(false)
 expect(exported.interests[0].source_id).toBe(exported.sources[0].key)
 expect(exported.saved).toHaveLength(1);expect(exported.library[0]).toMatchObject({folder:'IA',tags:['research']});expect(exported.reader[0].body).toBe('Full reader body');expect(exported.feedback[0].preference).toBe('like')
 const repeated=(await restore(owner,backup,true)).rows[0].result
 for(const key of ['sources','articles','saved','library','reader','feedback','interests','budget'])expect(repeated[key]).toBe(0)
})
it('rolls back all writes on owner conflict',async()=>{
 await expect(restore(other,{...backup,sources:[{...backup.sources[0],rss_url:'https://other.example/rss'}]},true)).rejects.toThrow('another owner')
 expect((await db.query('select * from sources where user_id=$1',[other])).rows).toHaveLength(0)
})
it('counts pending and uncertain requests against a serialized monthly allowance',async()=>{
 const reserve=()=>db.query<{result:{allowed:boolean;id:string}}>("select athena_reserve_ai($1,'picks','gpt-4o-mini',6000,'test') result",[owner])
 const values=await Promise.all([reserve(),reserve()]);expect(values.filter(x=>x.rows[0].result.allowed)).toHaveLength(1)
 const id=values.find(x=>x.rows[0].result.allowed)!.rows[0].result.id
 await db.query("update ai_usage set status='uncertain' where id=$1",[id]);expect((await reserve()).rows[0].result.allowed).toBe(false)
 await db.query("update ai_usage set status='measured',cost_microusd=1000,input_tokens=100,output_tokens=100 where id=$1",[id]);expect((await reserve()).rows[0].result.allowed).toBe(true)
 const summary=(await db.query<{result:{measured_microusd:number;reserved_microusd:number}}>('\nselect athena_ai_cost_summary($1,date_trunc(\'month\',now())) result',[owner])).rows[0].result
 expect(summary).toMatchObject({measured_microusd:1000,reserved_microusd:6000})
})
it('denies browser roles on backup functions and cost tables',async()=>{
 for(const role of ['anon','authenticated']){
  expect((await db.query<{allowed:boolean}>("select has_function_privilege($1,'athena_restore_backup(uuid,jsonb,boolean)','execute') allowed",[role])).rows[0].allowed).toBe(false)
  expect((await db.query<{allowed:boolean}>("select has_table_privilege($1,'ai_usage','select') allowed",[role])).rows[0].allowed).toBe(false)
 }
})
