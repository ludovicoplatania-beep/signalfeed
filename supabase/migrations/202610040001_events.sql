begin;
create table if not exists public.news_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 primary_checked_at timestamptz,primary_check_message text,
 title text not null check(length(title) between 1 and 180), synopsis text not null default '' check(length(synopsis)<=600),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id)
);
create table if not exists public.event_articles (
 user_id uuid not null, event_id uuid not null, article_id uuid not null references public.articles(id) on delete cascade,
 language text not null default 'other' check(language in ('it','en','fr','de','es','other')),
 focus text not null default '' check(length(focus)<=240), added_at timestamptz not null default now(),
 primary key(event_id,article_id),unique(user_id,article_id),
 foreign key(user_id,event_id) references public.news_events(user_id,id) on delete cascade
);
create table if not exists public.event_primary_links (
 user_id uuid not null,event_id uuid not null,article_id uuid not null,url text not null check(length(url)<=2048),
 label text not null check(length(label)<=200),checked_at timestamptz not null default now(),
 primary key(event_id,url),foreign key(event_id,article_id) references public.event_articles(event_id,article_id) on delete cascade,
 foreign key(user_id,event_id) references public.news_events(user_id,id) on delete cascade
);
create index if not exists news_events_recent on public.news_events(user_id,updated_at desc);
create index if not exists event_articles_owner on public.event_articles(user_id,event_id);
alter table public.news_events enable row level security;
alter table public.event_articles enable row level security;
alter table public.event_primary_links enable row level security;
revoke all on public.news_events,public.event_articles,public.event_primary_links from public,anon,authenticated;
grant all on public.news_events,public.event_articles,public.event_primary_links to service_role;
create or replace function public.athena_upsert_events(p_user uuid,p_events jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare entry jsonb; member jsonb; target uuid; inserted_count integer; groups jsonb:='[]'::jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':news_events',0));
 if jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events)>12 then raise exception 'Invalid event groups';end if;
 for entry in select value from jsonb_array_elements(p_events) loop
  if jsonb_array_length(entry->'articles')<2 then continue;end if;
  if exists(select 1 from jsonb_array_elements(entry->'articles') m where not exists(
   select 1 from articles a join sources s on s.id=a.source_id where a.id=(m->>'article_id')::uuid and s.user_id=p_user and a.duplicate_of is null
  )) then raise exception 'Invalid article ownership';end if;
  target:=null;
  -- Reuse a stored group only through an actual shared article, never title similarity alone.
  select ea.event_id into target from event_articles ea
   where ea.user_id=p_user and ea.article_id in(select (m->>'article_id')::uuid from jsonb_array_elements(entry->'articles') m)
   group by ea.event_id order by count(*) desc,ea.event_id limit 1;
  if target is null then
   insert into news_events(user_id,title,synopsis) values(p_user,entry->>'title',entry->>'synopsis') returning id into target;
  end if;
  inserted_count:=0;
  for member in select value from jsonb_array_elements(entry->'articles') loop
   if exists(select 1 from event_articles where user_id=p_user and article_id=(member->>'article_id')::uuid) then
    update event_articles set
     language=case when member->>'language'<>'other' then member->>'language' else language end,
     focus=coalesce(nullif(member->>'focus',''),focus)
     where user_id=p_user and event_id=target and article_id=(member->>'article_id')::uuid;
   else
    insert into event_articles(user_id,event_id,article_id,language,focus)
     values(p_user,target,(member->>'article_id')::uuid,member->>'language',member->>'focus');
    inserted_count:=inserted_count+1;
   end if;
  end loop;
  if inserted_count>0 then update news_events set updated_at=now() where id=target and user_id=p_user;end if;
  groups:=groups||jsonb_build_array(jsonb_build_object('id',target,'added',inserted_count));
 end loop;
 return groups;
end $$;
revoke all on function public.athena_upsert_events(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.athena_upsert_events(uuid,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
