import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll,beforeAll,expect,it } from 'vitest'
const db=new PGlite(),owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002'
const ids=Array.from({length:4},(_,n)=>`00000000-0000-4000-8000-00000000001${n}`)
beforeAll(async()=>{await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create table sources(id uuid primary key,user_id uuid,is_active boolean);create table articles(id uuid primary key,source_id uuid,duplicate_of uuid,created_at timestamptz,published_at timestamptz);insert into auth.users values('${owner}'),('${other}');insert into sources values('${owner}','${owner}',true),('${other}','${other}',true);`)
 for(const [index,id] of ids.entries())await db.query("insert into articles values($1,$2,null,now()+interval '1 second',now())",[id,index===3?other:owner])
 await db.exec(readFileSync(new URL('./202610040002_alerts.sql',import.meta.url),'utf8'));await db.query('insert into alert_settings(user_id) values($1)',[owner])
},30000)
afterAll(()=>db.close())
const reserve=(id:string)=>db.query<{id:string|null}>('select athena_reserve_alert($1,$2::jsonb) id',[owner,JSON.stringify([{article_id:id,reason:'Nuovo sviluppo'}])])
it('keeps alerts optional and enforces quiet hours before reserving',async()=>{
 expect((await reserve(ids[0])).rows[0].id).toBeNull()
 const hour=(await db.query<{local_hour:number}>('select extract(hour from now() at time zone \'Europe/Rome\')::integer as local_hour')).rows[0].local_hour
 await db.query('update alert_settings set enabled=true,quiet_start=$1,quiet_end=$2 where user_id=$3',[hour,(hour+1)%24,owner])
 expect((await reserve(ids[0])).rows[0].id).toBeNull()
})
it('enforces owner scope, interval, duplicate identity and the daily cap',async()=>{
 await db.query('update alert_settings set quiet_start=0,quiet_end=0,max_per_day=1 where user_id=$1',[owner])
 await expect(reserve(ids[3])).rejects.toThrow('Invalid article ownership')
 const id=(await reserve(ids[0])).rows[0].id;expect(id).toBeTruthy()
 expect((await reserve(ids[0])).rows[0].id).toBeNull();expect((await reserve(ids[1])).rows[0].id).toBeNull()
 await db.query("update news_alerts set created_at=now()-interval '3 hours' where id=$1",[id])
 expect((await reserve(ids[1])).rows[0].id).toBeNull()
 await db.query('update alert_settings set max_per_day=5 where user_id=$1',[owner])
 expect((await reserve(ids[1])).rows[0].id).toBeTruthy()
})
it('denies browser roles and atomically claims pending push per device',async()=>{
 for(const table of ['alert_settings','news_alerts','push_subscriptions','push_deliveries'])for(const role of ['anon','authenticated'])expect((await db.query<{allowed:boolean}>('select has_table_privilege($1,$2,\'select\') allowed',[role,table])).rows[0].allowed).toBe(false)
 await db.query("insert into push_subscriptions(user_id,endpoint,p256dh,auth) values($1,'https://fcm.googleapis.com/send/test','key','auth')",[owner])
 await db.query('insert into push_deliveries(user_id,alert_id,subscription_id) select $1,a.id,s.id from news_alerts a,push_subscriptions s where a.article_id=$2',[owner,ids[1]])
 expect((await db.query('select * from athena_claim_push($1)',[owner])).rows).toHaveLength(1)
 expect((await db.query('select * from athena_claim_push($1)',[owner])).rows).toHaveLength(0)
})
