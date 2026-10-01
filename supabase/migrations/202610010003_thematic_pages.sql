begin;
create table if not exists public.sector_curations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sector text not null,
  status text not null check (status in ('running','completed','automatic','failed')),
  picks jsonb not null default '[]'::jsonb,
  raw_response text,
  model text not null default 'gpt-4o-mini',
  usage jsonb,
  diagnostics jsonb,
  warning text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists sector_curations_latest on public.sector_curations(user_id,sector,created_at desc);
create unique index if not exists sector_curations_running on public.sector_curations(user_id,sector) where status='running';
alter table public.sector_curations enable row level security;
revoke all on public.sector_curations from anon,authenticated;
grant select,insert,update on public.sector_curations to service_role;

create or replace function public.athena_sector_feed(p_user uuid,p_pattern text,p_query text default '',p_source uuid default null,p_since timestamptz default null,p_offset integer default 0,p_limit integer default 50,p_exact_pattern text default null)
returns jsonb language sql stable security invoker set search_path=public as $$
  with matching as (
    select a.id,a.title,a.url,a.excerpt,a.image_url,a.article_content,a.published_at,a.created_at,a.source_id,
      jsonb_build_object('name',s.name) as sources,s.priority as source_priority
    from articles a join sources s on s.id=a.source_id
    where s.user_id=p_user and s.is_active and a.duplicate_of is null
      and (a.published_at is null or a.published_at<=now())
      and a.url not ilike '%internazionale.it/festival%'
      and (concat_ws(' ',a.title,a.excerpt) ~* p_pattern or (p_exact_pattern is not null and concat_ws(' ',a.title,a.excerpt) ~ p_exact_pattern))
      and (p_query='' or strpos(lower(concat_ws(' ',a.title,a.excerpt,s.name)),lower(p_query))>0)
      and (p_source is null or a.source_id=p_source)
      and (p_since is null or coalesce(a.published_at,a.created_at)>=p_since)
  ), page as (
    select * from matching order by coalesce(published_at,created_at) desc,created_at desc,id
    offset greatest(0,p_offset) limit least(300,greatest(1,p_limit))
  ) select jsonb_build_object('articles',coalesce((select jsonb_agg(to_jsonb(page) order by coalesce(published_at,created_at) desc,created_at desc,id) from page),'[]'::jsonb),'total',(select count(*) from matching));
$$;
revoke all on function public.athena_sector_feed(uuid,text,text,uuid,timestamptz,integer,integer,text) from public,anon,authenticated;
grant execute on function public.athena_sector_feed(uuid,text,text,uuid,timestamptz,integer,integer,text) to service_role;
commit;
