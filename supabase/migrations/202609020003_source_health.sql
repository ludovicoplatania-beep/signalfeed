begin;

alter table public.sources
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_error text,
  add column if not exists last_import_count integer not null default 0;

create index if not exists articles_source_published_idx
  on public.articles (source_id, published_at desc);

create index if not exists articles_title_search_idx
  on public.articles using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '')));

commit;
