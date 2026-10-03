-- Provision only after approval. Jobs remain inactive until live HTTP and
-- pipeline verification completes. No credentials are returned or embedded.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create schema if not exists athena_private;
revoke all on schema athena_private from public, anon, authenticated;

do $$ begin
  if not exists(select 1 from vault.secrets where name='athena_rss_cron_token') then
    perform vault.create_secret(replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''), 'athena_rss_cron_token', 'Athena RSS scheduling only');
  end if;
end $$;

create or replace function public.athena_validate_rss_cron(p_hash text)
returns boolean language sql stable security definer set search_path=''
as $$ select length(p_hash)=64 and exists(
  select 1 from vault.decrypted_secrets where name='athena_rss_cron_token'
  and encode(sha256(convert_to(decrypted_secret,'UTF8')),'hex')=p_hash
); $$;
revoke all on function public.athena_validate_rss_cron(text) from public,anon,authenticated;
grant execute on function public.athena_validate_rss_cron(text) to service_role;

create table if not exists athena_private.rss_requests(
  request_id bigint primary key, kind text not null check(kind in ('start','status')),
  created_at timestamptz not null default now(), checked_at timestamptz,
  http_status integer, request_error text
);
revoke all on athena_private.rss_requests from public,anon,authenticated;

create or replace function athena_private.invoke_rss(p_status boolean default false)
returns bigint language plpgsql security definer set search_path=''
as $$ declare token text; id bigint; begin
  select decrypted_secret into strict token from vault.decrypted_secrets where name='athena_rss_cron_token';
  select net.http_get(
    url := 'https://athena-os.vercel.app/api/cron/rss'||case when p_status then '?status=1' else '' end,
    headers := jsonb_build_object('Authorization','Bearer '||token),
    timeout_milliseconds := 30000
  ) into id;
  insert into athena_private.rss_requests(request_id,kind) values(id,case when p_status then 'status' else 'start' end);
  return id;
end $$;
revoke all on function athena_private.invoke_rss(boolean) from public,anon,authenticated;

create or replace function athena_private.check_rss()
returns void language plpgsql security definer set search_path=''
as $$ begin
  update athena_private.rss_requests r set checked_at=now(),http_status=h.status_code,
    request_error=case when h.timed_out then 'HTTP timeout' when h.error_msg is not null then 'HTTP transport error'
      when h.status_code not between 200 and 299 then 'HTTP rejected: '||coalesce(h.status_code::text,'unknown') else null end
  from net._http_response h where h.id=r.request_id and r.checked_at is null;
  update athena_private.rss_requests set checked_at=now(),request_error='No HTTP response within two minutes'
    where checked_at is null and created_at<now()-interval '2 minutes';
  -- Polling invokes the existing interrupted-job detection, and completion
  -- remains persisted as completed/partial/failed in athena_updates.
  if exists(select 1 from public.athena_updates where status='running') then
    perform athena_private.invoke_rss(true);
  end if;
end $$;
revoke all on function athena_private.check_rss() from public,anon,authenticated;

select cron.schedule('athena-rss-import','7,37 * * * *','select athena_private.invoke_rss(false);');
select cron.schedule('athena-rss-monitor','* * * * *','select athena_private.check_rss();');
do $$ declare id bigint; begin
  for id in select jobid from cron.job where jobname in ('athena-rss-import','athena-rss-monitor') loop
    perform cron.alter_job(id,active:=false);
  end loop;
end $$;
commit;

-- Activation (separate reviewed step after verification):
-- select cron.alter_job(jobid,active:=true) from cron.job
-- where jobname in ('athena-rss-import','athena-rss-monitor');
-- Rollback is the same query with active:=false. Leave legacy cron intact.
