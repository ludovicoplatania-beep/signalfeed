import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it } from 'vitest'
let db:PGlite
beforeEach(async()=>{
 db=new PGlite()
 // Host extensions are represented by their public interfaces; real migration
 // functions, privileges, disabled jobs and error recording execute in Postgres.
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema vault; create table vault.secrets(name text unique,secret text);
 create view vault.decrypted_secrets as select name,secret as decrypted_secret from vault.secrets;
 create function vault.create_secret(value text,name text,description text) returns uuid language plpgsql as $$begin insert into vault.secrets values(name,value);return gen_random_uuid();end$$;
 create schema cron; create table cron.job(jobid bigserial primary key,jobname text unique,schedule text,command text,active boolean default true);
 create function cron.schedule(name text,schedule text,command text) returns bigint language sql as $$insert into cron.job(jobname,schedule,command) values(name,schedule,command) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command returning jobid$$;
 create function cron.alter_job(id bigint,active boolean) returns void language sql as $$update cron.job set active=alter_job.active where jobid=id$$;
 insert into cron.job(jobname,schedule,command) values('unrelated-job','0 0 * * *','select 1');
 create schema net; create table net.requests(id bigserial primary key,url text,headers jsonb);
 create table net._http_response(id bigint,status_code integer,timed_out boolean,error_msg text);
 create function net.http_get(url text,headers jsonb,timeout_milliseconds integer) returns bigint language sql as $$insert into net.requests(url,headers) values(url,headers) returning id$$;
 create table public.athena_updates(status text);`)
 const migration=readFileSync(new URL('./202610030001_rss_scheduler.sql',import.meta.url),'utf8')
 await db.exec(migration.replace(/^create extension[^;]*;/gm,''))
})
afterEach(async()=>{await db?.close()})
it('provisions inactive jobs and preserves unrelated schedules and its credential on rerun',async()=>{
 expect((await db.query('select active from cron.job where jobname like $1',['athena-%'])).rows).toEqual([{active:false},{active:false}])
 expect((await db.query('select active from cron.job where jobname=$1',['unrelated-job'])).rows).toEqual([{active:true}])
 const sql=readFileSync(new URL('./202610030001_rss_scheduler.sql',import.meta.url),'utf8').replace(/^create extension[^;]*;/gm,'')
 await db.exec(sql)
 expect((await db.query('select count(*)::int as n from vault.secrets')).rows).toEqual([{n:1}])
 expect((await db.query('select count(*)::int as n from cron.job')).rows).toEqual([{n:3}])
})
it('denies client roles the validator and private scheduler but lets the service validate a hash',async()=>{
 await db.exec('set role anon')
 await expect(db.query("select public.athena_validate_rss_cron(repeat('0',64))")).rejects.toThrow(/permission denied/)
 await expect(db.query('select athena_private.invoke_rss(false)')).rejects.toThrow(/permission denied/)
 await db.exec('reset role; set role service_role')
 expect((await db.query("select public.athena_validate_rss_cron(repeat('0',64)) as valid")).rows).toEqual([{valid:false}])
 await db.exec('reset role')
 expect((await db.query("select public.athena_validate_rss_cron(encode(sha256(convert_to(decrypted_secret,'UTF8')),'hex')) as valid from vault.decrypted_secrets")).rows).toEqual([{valid:true}])
})
it('records rejected HTTP requests and polls running pipeline health through the RSS endpoint only',async()=>{
 await db.query('select athena_private.invoke_rss(false)')
 await db.exec("insert into net._http_response values(1,403,false,null); insert into public.athena_updates values('running');select athena_private.check_rss();")
 expect((await db.query('select http_status,request_error from athena_private.rss_requests where request_id=1')).rows).toEqual([{http_status:403,request_error:'HTTP rejected: 403'}])
 expect((await db.query('select url from net.requests order by id')).rows).toEqual([{url:'https://athena-os.vercel.app/api/cron/rss'},{url:'https://athena-os.vercel.app/api/cron/rss?status=1'}])
})
