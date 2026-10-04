begin;
create table if not exists public.alert_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,sectors text[] not null default '{}',keywords text[] not null default '{}',
 max_per_day integer not null default 3 check(max_per_day between 1 and 5),
 interval_minutes integer not null default 120 check(interval_minutes between 60 and 720),
 quiet_start integer not null default 22 check(quiet_start between 0 and 23),quiet_end integer not null default 8 check(quiet_end between 0 and 23),timezone text not null default 'Europe/Rome',
 enabled_since timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(cardinality(sectors)<=9),check(cardinality(keywords)<=12)
);
create table if not exists public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,p256dh text not null,auth text not null,active boolean not null default true,
 created_at timestamptz not null default now(),last_error text,unique(user_id,id)
);
create table if not exists public.news_alerts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 article_id uuid not null references public.articles(id) on delete cascade,reason text not null check(length(reason)<=300),
 created_at timestamptz not null default now(),read_at timestamptz,unique(user_id,article_id),unique(user_id,id)
);
create table if not exists public.push_deliveries (
 alert_id uuid not null,subscription_id uuid not null,user_id uuid not null,
 attempts integer not null default 0,status text not null default 'pending' check(status in ('pending','sending','sent','failed','expired')),
 attempted_at timestamptz,sent_at timestamptz,last_error text,
 primary key(alert_id,subscription_id),
 foreign key(user_id,alert_id) references public.news_alerts(user_id,id) on delete cascade,
 foreign key(user_id,subscription_id) references public.push_subscriptions(user_id,id) on delete cascade
);
create index if not exists news_alerts_recent on public.news_alerts(user_id,created_at desc);
alter table public.alert_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.news_alerts enable row level security;
alter table public.push_deliveries enable row level security;
revoke all on public.alert_settings,public.push_subscriptions,public.news_alerts,public.push_deliveries from public,anon,authenticated;
grant all on public.alert_settings,public.push_subscriptions,public.news_alerts,public.push_deliveries to service_role;
create or replace function public.athena_reserve_alert(p_user uuid,p_candidates jsonb) returns uuid language plpgsql security invoker set search_path=public as $$
declare cfg alert_settings;local_now timestamp;candidate jsonb;alert_id uuid;article_created timestamptz;article_published timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended('athena-alert:'||p_user::text,0));
 select * into cfg from alert_settings where user_id=p_user;
 if not found or not cfg.enabled then return null;end if;
 local_now=now() at time zone cfg.timezone;
 if cfg.quiet_start<>cfg.quiet_end and ((cfg.quiet_start<cfg.quiet_end and extract(hour from local_now)>=cfg.quiet_start and extract(hour from local_now)<cfg.quiet_end) or (cfg.quiet_start>cfg.quiet_end and (extract(hour from local_now)>=cfg.quiet_start or extract(hour from local_now)<cfg.quiet_end))) then return null;end if;
 if (select count(*) from news_alerts where user_id=p_user and (created_at at time zone cfg.timezone)::date=local_now::date)>=cfg.max_per_day then return null;end if;
 if exists(select 1 from news_alerts where user_id=p_user and created_at>now()-make_interval(mins=>cfg.interval_minutes)) then return null;end if;
 for candidate in select value from jsonb_array_elements(p_candidates) limit 30 loop
  select a.created_at,coalesce(a.published_at,a.created_at) into article_created,article_published from articles a join sources s on s.id=a.source_id where a.id=(candidate->>'article_id')::uuid and s.user_id=p_user and s.is_active and a.duplicate_of is null;
  if not found then raise exception 'Invalid article ownership';end if;
  if article_created<cfg.enabled_since or article_published<now()-interval '24 hours' or article_published>now()+interval '5 minutes' then continue;end if;
  insert into news_alerts(user_id,article_id,reason) values(p_user,(candidate->>'article_id')::uuid,left(candidate->>'reason',300)) on conflict(user_id,article_id) do nothing returning id into alert_id;
  if alert_id is not null then
   insert into push_deliveries(user_id,alert_id,subscription_id) select p_user,alert_id,id from push_subscriptions where user_id=p_user and active;
   return alert_id;
  end if;
 end loop;
 return null;
end $$;
create or replace function public.athena_claim_push(p_user uuid) returns setof public.push_deliveries language plpgsql security invoker set search_path=public as $$
declare cfg alert_settings;hour_now integer;
begin
 select * into cfg from alert_settings where user_id=p_user;
 if not found or not cfg.enabled then return;end if;
 hour_now=extract(hour from now() at time zone cfg.timezone);
 if cfg.quiet_start<>cfg.quiet_end and ((cfg.quiet_start<cfg.quiet_end and hour_now>=cfg.quiet_start and hour_now<cfg.quiet_end) or (cfg.quiet_start>cfg.quiet_end and (hour_now>=cfg.quiet_start or hour_now<cfg.quiet_end))) then return;end if;
 return query update push_deliveries d set status='sending',attempts=d.attempts+1,attempted_at=now() where (d.alert_id,d.subscription_id) in (
 select q.alert_id,q.subscription_id from push_deliveries q join news_alerts a on a.id=q.alert_id join push_subscriptions s on s.id=q.subscription_id
 where q.user_id=p_user and a.created_at>now()-interval '2 hours' and s.active and q.attempts<3
 and (q.status in ('pending','failed') or (q.status='sending' and q.attempted_at<now()-interval '10 minutes'))
 and (q.attempted_at is null or q.attempted_at<now()-interval '5 minutes') order by a.created_at limit 15 for update of q skip locked
 ) returning d.*;
end $$;
revoke all on function public.athena_reserve_alert(uuid,jsonb),public.athena_claim_push(uuid) from public,anon,authenticated;
grant execute on function public.athena_reserve_alert(uuid,jsonb),public.athena_claim_push(uuid) to service_role;
notify pgrst,'reload schema';
commit;
