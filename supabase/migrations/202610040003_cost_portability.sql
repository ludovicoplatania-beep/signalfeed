begin;
create table public.ai_budget (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 monthly_limit_microusd bigint not null default 5000000 check(monthly_limit_microusd between 10000 and 1000000000),
 updated_at timestamptz not null default now()
);
create table public.ai_usage (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 stage text not null, model text not null, rate_version text not null,
 status text not null default 'reserved' check(status in ('reserved','measured','rejected','uncertain')),
 reserved_microusd bigint not null check(reserved_microusd>=0), cost_microusd bigint check(cost_microusd>=0),
 input_tokens integer,output_tokens integer,cached_tokens integer,
 created_at timestamptz not null default now(),finished_at timestamptz
);
create index ai_usage_owner_month on public.ai_usage(user_id,created_at);
alter table public.ai_budget enable row level security;
alter table public.ai_usage enable row level security;
revoke all on public.ai_budget,public.ai_usage from public,anon,authenticated;
grant all on public.ai_budget,public.ai_usage to service_role;
create function public.athena_reserve_ai(p_owner uuid,p_stage text,p_model text,p_reserved bigint,p_rate text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b ai_budget; spent bigint; attempt uuid;
begin
 if p_reserved<0 or p_reserved>10000000 then raise exception 'Invalid reservation';end if;
 perform pg_advisory_xact_lock(hashtextextended('ai-budget:'||p_owner,0));
 select * into b from ai_budget where user_id=p_owner;
 select coalesce(sum(coalesce(cost_microusd,reserved_microusd)),0) into spent from ai_usage
 where user_id=p_owner and created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC';
 if b.enabled and spent+p_reserved>b.monthly_limit_microusd then return jsonb_build_object('allowed',false);end if;
 insert into ai_usage(user_id,stage,model,reserved_microusd,rate_version) values(p_owner,p_stage,p_model,p_reserved,p_rate) returning id into attempt;
 return jsonb_build_object('allowed',true,'id',attempt);
end $$;

-- A single statement gives a consistent snapshot; only explicitly selected portable fields leave the database.
create function public.athena_export_backup(p_owner uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
select jsonb_build_object('format','athena-backup','version',1,'exported_at',now(),
 'sources',coalesce((select jsonb_agg(jsonb_build_object('key',id,'name',name,'website_url',website_url,'rss_url',rss_url,'is_active',coalesce(is_active,false),'priority',coalesce(priority,3)) order by id) from sources where user_id=p_owner),'[]'),
 'interests',coalesce((select interests from user_interests where user_id=p_owner),'[]'),
 'budget',(select jsonb_build_object('enabled',enabled,'monthly_limit_microusd',monthly_limit_microusd) from ai_budget where user_id=p_owner),
 'alerts',(select jsonb_build_object('enabled',enabled,'sectors',sectors,'keywords',keywords,'max_per_day',max_per_day,'interval_minutes',interval_minutes,'quiet_start',quiet_start,'quiet_end',quiet_end,'timezone',timezone) from alert_settings where user_id=p_owner),
 'articles',coalesce((select jsonb_agg(jsonb_build_object('key',a.id,'source_key',a.source_id,'title',a.title,'url',a.url,'excerpt',a.excerpt,'article_content',a.article_content,'published_at',a.published_at,'image_url',a.image_url,'canonical_url',a.canonical_url) order by a.id) from articles a join sources s on s.id=a.source_id where s.user_id=p_owner and (exists(select 1 from saved_articles where user_id=p_owner and article_id=a.id) or exists(select 1 from article_library where user_id=p_owner and article_id=a.id) or exists(select 1 from article_feedback where user_id=p_owner and article_id=a.id))),'[]'),
 'saved',coalesce((select jsonb_agg(jsonb_build_object('article_key',x.article_id,'created_at',x.created_at) order by x.article_id) from saved_articles x join articles a on a.id=x.article_id join sources s on s.id=a.source_id where x.user_id=p_owner and s.user_id=p_owner),'[]'),
 'library',coalesce((select jsonb_agg(jsonb_build_object('article_key',x.article_id,'read_at',x.read_at,'folder',x.folder,'tags',x.tags) order by x.article_id) from article_library x join articles a on a.id=x.article_id join sources s on s.id=a.source_id where x.user_id=p_owner and s.user_id=p_owner),'[]'),
 'feedback',coalesce((select jsonb_agg(jsonb_build_object('article_key',x.article_id,'preference',x.preference) order by x.article_id) from article_feedback x join articles a on a.id=x.article_id join sources s on s.id=a.source_id where x.user_id=p_owner and s.user_id=p_owner),'[]'),
 'reader',coalesce((select jsonb_agg(jsonb_build_object('article_key',x.article_id,'body',x.body,'content_status',x.content_status,'checked_at',x.checked_at) order by x.article_id) from reader_cache x where x.user_id=p_owner and (exists(select 1 from saved_articles where user_id=p_owner and article_id=x.article_id) or exists(select 1 from article_library where user_id=p_owner and article_id=x.article_id) or exists(select 1 from article_feedback where user_id=p_owner and article_id=x.article_id))),'[]'));
$$;

create function public.athena_restore_backup(p_owner uuid,p_backup jsonb,p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v jsonb;sid uuid;aid uuid;source_map jsonb:='{}';article_map jsonb:='{}';existing_owner uuid;
 ns integer:=0;na integer:=0;nsv integer:=0;nl integer:=0;nf integer:=0;nr integer:=0;ni integer:=0;nb integer:=0;nt integer:=0;
begin
 if p_backup->>'format'<>'athena-backup' or (p_backup->>'version')::int<>1 then raise exception 'Unsupported backup';end if;
 perform pg_advisory_xact_lock(hashtextextended('restore:'||p_owner,0));
 for v in select value from jsonb_array_elements(p_backup->'sources') loop
  select id into sid from sources where user_id=p_owner and rtrim(rss_url,'/')=rtrim(v->>'rss_url','/') order by id limit 1;
  if sid is null then
   ns:=ns+1;sid:=gen_random_uuid();
   if p_apply then insert into sources(id,user_id,name,website_url,rss_url,is_active,priority)
    values(sid,p_owner,v->>'name',v->>'website_url',v->>'rss_url',false,(v->>'priority')::int);end if;
  end if;
  source_map:=source_map||jsonb_build_object(v->>'key',sid);
 end loop;
 for v in select value from jsonb_array_elements(p_backup->'articles') order by value->>'canonical_url' loop
  aid:=null;existing_owner:=null;
  perform pg_advisory_xact_lock(hashtextextended(v->>'canonical_url',0));
  select a.id,s.user_id into aid,existing_owner from articles a join sources s on s.id=a.source_id where a.canonical_url=v->>'canonical_url' or a.url=v->>'url' order by (a.canonical_url is not null) desc,a.created_at limit 1;
  if aid is not null and existing_owner<>p_owner then raise exception 'Article belongs to another owner';end if;
  if aid is null then
   na:=na+1;aid:=gen_random_uuid();sid:=(source_map->>(v->>'source_key'))::uuid;
   if sid is null then raise exception 'Missing source';end if;
   if p_apply then insert into articles(id,source_id,title,url,excerpt,article_content,published_at,image_url,hash,canonical_url)
    values(aid,sid,v->>'title',v->>'url',v->>'excerpt',v->>'article_content',(v->>'published_at')::timestamptz,v->>'image_url',md5(v->>'canonical_url'),v->>'canonical_url');end if;
  end if;
  article_map:=article_map||jsonb_build_object(v->>'key',aid);
 end loop;
 for v in select value from jsonb_array_elements(p_backup->'saved') loop
  aid:=(article_map->>(v->>'article_key'))::uuid;if aid is null then raise exception 'Missing article';end if;
  if not exists(select 1 from saved_articles where user_id=p_owner and article_id=aid) then nsv:=nsv+1;
   if p_apply then insert into saved_articles(user_id,article_id,created_at) values(p_owner,aid,(v->>'created_at')::timestamptz) on conflict(user_id,article_id) do nothing;end if;end if;
 end loop;
 for v in select value from jsonb_array_elements(p_backup->'library') loop
  aid:=(article_map->>(v->>'article_key'))::uuid;if aid is null then raise exception 'Missing article';end if;
  if not exists(select 1 from article_library where user_id=p_owner and article_id=aid) then nl:=nl+1;
   if p_apply then insert into article_library(user_id,article_id,read_at,folder,tags) values(p_owner,aid,(v->>'read_at')::timestamptz,v->>'folder',array(select jsonb_array_elements_text(v->'tags'))) on conflict do nothing;end if;end if;
 end loop;
 for v in select value from jsonb_array_elements(p_backup->'feedback') loop
  aid:=(article_map->>(v->>'article_key'))::uuid;if aid is null then raise exception 'Missing article';end if;
  if not exists(select 1 from article_feedback where user_id=p_owner and article_id=aid) then nf:=nf+1;
   if p_apply then insert into article_feedback(user_id,article_id,preference,title,excerpt,source_id,source_name)
    select p_owner,a.id,v->>'preference',a.title,left(coalesce(a.excerpt,''),500),s.id,s.name from articles a join sources s on s.id=a.source_id where a.id=aid on conflict do nothing;end if;end if;
 end loop;
 for v in select value from jsonb_array_elements(p_backup->'reader') loop
  aid:=(article_map->>(v->>'article_key'))::uuid;if aid is null then raise exception 'Missing article';end if;
  if not exists(select 1 from reader_cache where user_id=p_owner and article_id=aid) then nr:=nr+1;
   if p_apply then insert into reader_cache(user_id,article_id,body,content_status,checked_at) values(p_owner,aid,v->>'body',v->>'content_status',(v->>'checked_at')::timestamptz) on conflict do nothing;end if;end if;
 end loop;
 if not exists(select 1 from user_interests where user_id=p_owner) then ni:=1;
  if p_apply then insert into user_interests(user_id,interests) values(p_owner,(select coalesce(jsonb_agg(case when x ? 'source_id' then x||jsonb_build_object('source_id',source_map->>(x->>'source_id')) else x end),'[]') from jsonb_array_elements(p_backup->'interests') x)) on conflict do nothing;end if;
 end if;
 if p_backup->'budget'<>'null'::jsonb and not exists(select 1 from ai_budget where user_id=p_owner) then nb:=1;
  if p_apply then insert into ai_budget(user_id,enabled,monthly_limit_microusd) values(p_owner,(p_backup->'budget'->>'enabled')::boolean,(p_backup->'budget'->>'monthly_limit_microusd')::bigint) on conflict do nothing;end if;end if;
 if p_backup->'alerts'<>'null'::jsonb and not exists(select 1 from alert_settings where user_id=p_owner) then nt:=1;
  v:=p_backup->'alerts';if p_apply then insert into alert_settings(user_id,enabled,sectors,keywords,max_per_day,interval_minutes,quiet_start,quiet_end,timezone)
   values(p_owner,false,array(select jsonb_array_elements_text(v->'sectors')),array(select jsonb_array_elements_text(v->'keywords')),(v->>'max_per_day')::int,(v->>'interval_minutes')::int,(v->>'quiet_start')::int,(v->>'quiet_end')::int,v->>'timezone') on conflict do nothing;end if;end if;
 return jsonb_build_object('sources',ns,'articles',na,'saved',nsv,'library',nl,'feedback',nf,'reader',nr,'interests',ni,'budget',nb,'alerts',nt,'applied',p_apply);
end $$;
revoke all on function public.athena_reserve_ai(uuid,text,text,bigint,text),public.athena_export_backup(uuid),public.athena_restore_backup(uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.athena_reserve_ai(uuid,text,text,bigint,text),public.athena_export_backup(uuid),public.athena_restore_backup(uuid,jsonb,boolean) to service_role;
create function public.athena_ai_cost_summary(p_owner uuid,p_start timestamptz) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
select jsonb_build_object('month_start',p_start,'tracking_since',(select min(created_at) from ai_usage where user_id=p_owner),'attempts',count(*),'measured_microusd',coalesce(sum(cost_microusd),0),'uncertain_microusd',coalesce(sum(reserved_microusd) filter(where status='uncertain'),0),'reserved_microusd',coalesce(sum(reserved_microusd) filter(where status='reserved'),0),'input_tokens',coalesce(sum(input_tokens),0),'output_tokens',coalesce(sum(output_tokens),0),'cached_tokens',coalesce(sum(cached_tokens),0),'stages',coalesce((select jsonb_object_agg(stage,amount) from (select stage,sum(coalesce(cost_microusd,reserved_microusd)) amount from ai_usage where user_id=p_owner and created_at>=p_start group by stage) s),'{}')) from ai_usage where user_id=p_owner and created_at>=p_start;
$$;
revoke all on function public.athena_ai_cost_summary(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.athena_ai_cost_summary(uuid,timestamptz) to service_role;
commit;
