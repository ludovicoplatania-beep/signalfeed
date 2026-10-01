begin;

-- Keep historical records. Duplicates are hidden and point at the surviving article.
alter table public.articles
  add column if not exists canonical_url text,
  add column if not exists duplicate_of uuid references public.articles(id);
create unique index if not exists articles_canonical_url_key on public.articles(canonical_url);
create index if not exists articles_visible_date_idx on public.articles(published_at desc, id) where duplicate_of is null;

alter table public.sources
  add column if not exists resolved_feed_url text,
  add column if not exists last_new_count integer not null default 0,
  add column if not exists last_updated_count integer not null default 0;

alter table public.ai_picks add column if not exists is_current boolean not null default true;
alter table public.ai_picks add column if not exists selection_method text not null default 'ai';
alter table public.trending_topics add column if not exists is_current boolean not null default true;

create table if not exists public.athena_updates (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  mode text not null check (mode in ('all', 'rss', 'ai', 'profile')),
  status text not null check (status in ('running', 'completed', 'partial', 'failed')),
  phase text not null default 'queued',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  result jsonb,
  message text
);
alter table public.athena_updates enable row level security;
revoke all on public.athena_updates from anon, authenticated;

create or replace function public.athena_start_update(p_user uuid, p_mode text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare job public.athena_updates; claimed boolean;
begin
  insert into public.athena_updates(user_id, mode, status)
    values(p_user, p_mode, 'running')
  on conflict(user_id) do update set id = gen_random_uuid(), mode = p_mode,
    status = 'running', phase = 'queued', started_at = now(), updated_at = now(), result = null, message = null
  where athena_updates.status <> 'running' or athena_updates.updated_at < now() - interval '6 minutes'
  returning * into job;
  claimed := found;
  if not claimed then select * into job from public.athena_updates where user_id = p_user; end if;
  return jsonb_build_object('claimed', claimed, 'job', to_jsonb(job));
end $$;

-- Concurrent backfills and imports converge on one canonical record.
create or replace function public.athena_register_article(p_id uuid, p_key text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare keeper uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));
  select id into keeper from public.articles where canonical_url = p_key;
  if keeper is null then
    update public.articles set canonical_url = p_key, duplicate_of = null where id = p_id;
    keeper := p_id;
  elsif keeper <> p_id then
    update public.articles set duplicate_of = keeper, canonical_url = null where id = p_id;
  end if;
  return keeper;
end $$;

-- Replace the visible selection in one transaction; empty/invalid output never erases it.
create or replace function public.athena_repair_articles(p_entries jsonb)
returns integer language plpgsql security invoker set search_path = public as $$
declare entry jsonb; repaired integer := 0;
begin
  for entry in select * from jsonb_array_elements(p_entries) loop
    perform public.athena_register_article((entry->>'id')::uuid, entry->>'key');
    repaired := repaired + 1;
  end loop;
  return repaired;
end $$;

-- Atomic ingestion: concurrent source imports cannot double-count or overwrite rich content.
create or replace function public.athena_ingest_articles(p_source uuid, p_articles jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare entry jsonb; incoming public.articles; previous public.articles;
  new_count integer := 0; updated_count integer := 0; unchanged_count integer := 0;
begin
  for entry in select value from jsonb_array_elements(p_articles) order by value->>'canonical_url' loop
    perform pg_advisory_xact_lock(hashtextextended(entry->>'canonical_url', 0));
    incoming := jsonb_populate_record(null::public.articles, entry);
    select * into previous from public.articles where canonical_url = incoming.canonical_url for update;
    if not found then
      insert into public.articles(source_id, canonical_url, title, url, excerpt, article_content, published_at, image_url, hash)
        values(p_source, incoming.canonical_url, incoming.title, incoming.url, incoming.excerpt, incoming.article_content,
          incoming.published_at, incoming.image_url, incoming.hash);
      new_count := new_count + 1;
    else
      incoming.published_at := coalesce(incoming.published_at, previous.published_at);
      incoming.article_content := coalesce(nullif(incoming.article_content, ''), previous.article_content);
      incoming.excerpt := coalesce(nullif(incoming.excerpt, ''), previous.excerpt);
      incoming.image_url := coalesce(nullif(incoming.image_url, ''), previous.image_url);
      incoming.source_id := previous.source_id;
      if not exists(select 1 from public.sources where id = previous.source_id and is_active) then incoming.source_id := p_source; end if;
      if row(previous.title, previous.excerpt, previous.article_content, previous.published_at, previous.image_url, previous.source_id)
        is distinct from row(incoming.title, incoming.excerpt, incoming.article_content, incoming.published_at, incoming.image_url, incoming.source_id) then
        update public.articles set title = incoming.title, excerpt = incoming.excerpt, article_content = incoming.article_content,
          published_at = incoming.published_at, image_url = incoming.image_url, source_id = incoming.source_id where id = previous.id;
        updated_count := updated_count + 1;
      else unchanged_count := unchanged_count + 1; end if;
    end if;
  end loop;
  return jsonb_build_object('newCount', new_count, 'updatedCount', updated_count, 'unchangedCount', unchanged_count);
end $$;

create or replace function public.athena_replace_picks(p_user uuid, p_picks jsonb)
returns integer language plpgsql security invoker set search_path = public as $$
declare inserted integer := 0; entry jsonb; existing_id uuid;
begin
  if jsonb_typeof(p_picks) <> 'array' or jsonb_array_length(p_picks) = 0 or jsonb_array_length(p_picks) > 10 then
    raise exception 'Invalid or empty picks';
  end if;
  if (select count(distinct p->>'article_id') from jsonb_array_elements(p_picks) p) <> jsonb_array_length(p_picks) then
    raise exception 'Duplicate picks';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_picks) p
    where not exists(select 1 from public.articles a join public.sources s on s.id = a.source_id
      where a.id = (p->>'article_id')::uuid and s.user_id = p_user and s.is_active and a.duplicate_of is null)
  ) then raise exception 'Invalid article ownership'; end if;
  update public.ai_picks set is_current = false where user_id = p_user and is_current;
  for entry in select * from jsonb_array_elements(p_picks) loop
    existing_id := null;
    select id into existing_id from public.ai_picks
      where user_id = p_user and article_id = (entry->>'article_id')::uuid order by created_at desc limit 1;
    if existing_id is not null then
      update public.ai_picks set score = (entry->>'score')::numeric, summary = entry->>'summary',
        reason = entry->>'reason', category = entry->>'category', selection_method = coalesce(entry->>'selection_method', 'ai'),
        is_current = true, created_at = now() where id = existing_id;
    else
      insert into public.ai_picks(user_id, article_id, score, summary, reason, category, selection_method, is_current)
        values(p_user, (entry->>'article_id')::uuid, (entry->>'score')::numeric, entry->>'summary',
          entry->>'reason', entry->>'category', coalesce(entry->>'selection_method', 'ai'), true);
    end if;
    inserted := inserted + 1;
  end loop;
  return inserted;
end $$;

create or replace function public.athena_replace_topics(p_user uuid, p_topics jsonb)
returns integer language plpgsql security invoker set search_path = public as $$
declare inserted integer;
begin
  if jsonb_typeof(p_topics) <> 'array' or jsonb_array_length(p_topics) = 0 or jsonb_array_length(p_topics) > 8 then
    raise exception 'Invalid or empty topics';
  end if;
  update public.trending_topics set is_current = false where user_id = p_user and is_current;
  insert into public.trending_topics(user_id, title, description, score, articles, is_current)
    select p_user, t.title, t.description, t.score, t.articles, true
    from jsonb_populate_recordset(null::public.trending_topics, p_topics) t;
  get diagnostics inserted = row_count;
  return inserted;
end $$;

revoke all on function public.athena_ingest_articles(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.athena_ingest_articles(uuid, jsonb) to service_role;
revoke all on function public.athena_start_update(uuid, text) from public, anon, authenticated;
revoke all on function public.athena_register_article(uuid, text) from public, anon, authenticated;
revoke all on function public.athena_repair_articles(jsonb) from public, anon, authenticated;
revoke all on function public.athena_replace_picks(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.athena_replace_topics(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.athena_start_update(uuid, text) to service_role;
grant execute on function public.athena_register_article(uuid, text) to service_role;
grant execute on function public.athena_repair_articles(jsonb) to service_role;
grant execute on function public.athena_replace_picks(uuid, jsonb) to service_role;
grant execute on function public.athena_replace_topics(uuid, jsonb) to service_role;
grant all on public.athena_updates to service_role;
notify pgrst, 'reload schema';
commit;
