begin;
create or replace function public.athena_restore_backup(p_owner uuid,p_backup jsonb,p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v jsonb;sid uuid;aid uuid;source_map jsonb:='{}';seen_feeds jsonb:='{}';article_map jsonb:='{}';existing_owner uuid;
 ns integer:=0;na integer:=0;nsv integer:=0;nl integer:=0;nf integer:=0;nr integer:=0;ni integer:=0;nb integer:=0;nt integer:=0;
begin
 if p_backup->>'format'<>'athena-backup' or (p_backup->>'version')::int<>1 then raise exception 'Unsupported backup';end if;
 perform pg_advisory_xact_lock(hashtextextended('restore:'||p_owner,0));
 for v in select value from jsonb_array_elements(p_backup->'sources') loop
  select id into sid from sources where user_id=p_owner and rtrim(rss_url,'/')=rtrim(v->>'rss_url','/') order by id limit 1;
  if sid is null then sid:=(seen_feeds->>rtrim(v->>'rss_url','/'))::uuid;end if;
  if sid is null then
   ns:=ns+1;sid:=gen_random_uuid();
   if p_apply then insert into sources(id,user_id,name,website_url,rss_url,is_active,priority)
    values(sid,p_owner,v->>'name',v->>'website_url',v->>'rss_url',false,(v->>'priority')::int);end if;
  end if;
  seen_feeds:=seen_feeds||jsonb_build_object(rtrim(v->>'rss_url','/'),sid);
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
commit;
