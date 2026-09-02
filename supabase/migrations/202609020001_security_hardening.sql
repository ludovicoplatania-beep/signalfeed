begin;

alter table public.trending_topics
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- I topic sono dati derivati: quelli storici, privi di proprietario, verranno rigenerati.
delete from public.trending_topics where user_id is null;
alter table public.trending_topics alter column user_id set not null;

create index if not exists sources_user_id_idx on public.sources(user_id);
create index if not exists articles_source_id_idx on public.articles(source_id);
create index if not exists saved_articles_user_id_idx on public.saved_articles(user_id);
create index if not exists ai_picks_user_id_idx on public.ai_picks(user_id);
create index if not exists daily_digests_user_id_idx on public.daily_digests(user_id);
create index if not exists user_events_user_id_idx on public.user_events(user_id);
create index if not exists user_interests_user_id_idx on public.user_interests(user_id);
create index if not exists trending_topics_user_id_idx on public.trending_topics(user_id);

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.saved_articles enable row level security;
alter table public.ai_picks enable row level security;
alter table public.daily_digests enable row level security;
alter table public.user_events enable row level security;
alter table public.user_interests enable row level security;
alter table public.trending_topics enable row level security;

-- Rimuove eventuali policy legacy permissive prima di installare il set verificato.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'sources', 'articles', 'saved_articles', 'ai_picks',
        'daily_digests', 'user_events', 'user_interests', 'trending_topics'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

drop policy if exists sources_select_own on public.sources;
drop policy if exists sources_insert_own on public.sources;
drop policy if exists sources_update_own on public.sources;
drop policy if exists sources_delete_own on public.sources;
create policy sources_select_own on public.sources for select using (auth.uid() = user_id);
create policy sources_insert_own on public.sources for insert with check (auth.uid() = user_id);
create policy sources_update_own on public.sources for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sources_delete_own on public.sources for delete using (auth.uid() = user_id);

drop policy if exists articles_select_own on public.articles;
create policy articles_select_own on public.articles for select using (
  exists (
    select 1 from public.sources
    where sources.id = articles.source_id and sources.user_id = auth.uid()
  )
);

drop policy if exists saved_articles_select_own on public.saved_articles;
drop policy if exists saved_articles_insert_own on public.saved_articles;
drop policy if exists saved_articles_delete_own on public.saved_articles;
create policy saved_articles_select_own on public.saved_articles for select using (auth.uid() = user_id);
create policy saved_articles_insert_own on public.saved_articles for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.articles
    where articles.id = saved_articles.article_id
  )
);
create policy saved_articles_delete_own on public.saved_articles for delete using (auth.uid() = user_id);

drop policy if exists ai_picks_select_own on public.ai_picks;
create policy ai_picks_select_own on public.ai_picks for select using (auth.uid() = user_id);

drop policy if exists daily_digests_select_own on public.daily_digests;
create policy daily_digests_select_own on public.daily_digests for select using (auth.uid() = user_id);

drop policy if exists user_events_select_own on public.user_events;
create policy user_events_select_own on public.user_events for select using (auth.uid() = user_id);

drop policy if exists user_interests_select_own on public.user_interests;
create policy user_interests_select_own on public.user_interests for select using (auth.uid() = user_id);

drop policy if exists trending_topics_select_own on public.trending_topics;
create policy trending_topics_select_own on public.trending_topics for select using (auth.uid() = user_id);

commit;
