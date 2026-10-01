begin;
create table if not exists public.article_feedback (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  preference text check (preference in ('like','less_topic','less_source')),
  title text not null,
  excerpt text,
  source_id uuid not null references public.sources(id) on delete cascade,
  source_name text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
create index if not exists article_feedback_user_updated on public.article_feedback(user_id, updated_at desc);
alter table public.article_feedback enable row level security;
revoke all on public.article_feedback from anon, authenticated;
grant select, insert, update on public.article_feedback to service_role;

create or replace function public.athena_set_feedback(p_user uuid, p_article uuid, p_preference text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare target uuid;
begin
  if p_preference is not null and p_preference not in ('like','less_topic','less_source') then
    raise exception 'Preferenza non valida';
  end if;
  select coalesce(a.duplicate_of, a.id) into target from articles a
    join sources s on s.id = a.source_id where a.id = p_article and s.user_id = p_user;
  if target is null then raise exception 'Articolo non disponibile'; end if;
  insert into article_feedback(user_id,article_id,preference,title,excerpt,source_id,source_name,updated_at)
  select p_user,a.id,p_preference,a.title,left(a.excerpt,500),s.id,s.name,now()
  from articles a join sources s on s.id=a.source_id where a.id=target and s.user_id=p_user
  on conflict(user_id,article_id) do update set preference=excluded.preference,
    title=excluded.title,excerpt=excluded.excerpt,source_name=excluded.source_name,updated_at=now();
  if not found then raise exception 'Articolo non disponibile'; end if;
  return target;
end $$;
revoke all on function public.athena_set_feedback(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.athena_set_feedback(uuid,uuid,text) to service_role;

create or replace function public.athena_home_feed(p_user uuid)
returns jsonb language sql stable security invoker set search_path = public as $$
  with ranked as (
    select a.id,a.title,a.url,a.excerpt,a.image_url,a.article_content,a.published_at,a.created_at,a.source_id,
      jsonb_build_object('name',s.name) as sources,
      row_number() over(partition by lower(regexp_replace(coalesce(nullif(s.website_url,''),s.rss_url),'^https?://(www\.)?([^/]+).*$', '\2'))
        order by coalesce(a.published_at,a.created_at) desc,a.created_at desc,a.id) as publisher_rank
    from articles a join sources s on s.id=a.source_id
    where s.user_id=p_user and s.is_active and a.duplicate_of is null
      and (a.published_at is null or a.published_at<=now())
      and coalesce(a.published_at,a.created_at)>=now()-interval '14 days'
      and a.url not ilike '%internazionale.it/festival%'
  ), chosen as (
    select * from ranked order by (publisher_rank<=4) desc, coalesce(published_at,created_at) desc,id limit 100
  )
  select coalesce(jsonb_agg(to_jsonb(chosen)-'publisher_rank'-'created_at' order by coalesce(published_at,created_at) desc,id),'[]'::jsonb) from chosen;
$$;
revoke all on function public.athena_home_feed(uuid) from public,anon,authenticated;
grant execute on function public.athena_home_feed(uuid) to service_role;

create or replace function public.athena_add_verified_source(p_user uuid,p_name text,p_site text,p_feed text,p_priority integer)
returns uuid language plpgsql security invoker set search_path = public as $$
declare target uuid;
begin
  perform pg_advisory_xact_lock(hashtext('athena-source-'||p_user::text));
  select id into target from sources where user_id=p_user and
    (rtrim(rss_url,'/')=rtrim(p_feed,'/') or rtrim(resolved_feed_url,'/')=rtrim(p_feed,'/')) limit 1;
  if target is not null then return target; end if;
  insert into sources(user_id,name,website_url,rss_url,priority,is_active,resolved_feed_url)
    values(p_user,p_name,p_site,p_feed,p_priority,true,p_feed) returning id into target;
  return target;
end $$;
revoke all on function public.athena_add_verified_source(uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.athena_add_verified_source(uuid,text,text,text,integer) to service_role;
commit;
