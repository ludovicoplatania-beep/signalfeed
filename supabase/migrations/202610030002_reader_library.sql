begin;
alter table athena_private.rss_requests enable row level security;
create table public.article_library (
 user_id uuid not null references auth.users(id) on delete cascade,
 article_id uuid not null references public.articles(id) on delete cascade,
 read_at timestamptz,
 folder text not null default '' check(length(folder)<=80),
 tags text[] not null default '{}' check(cardinality(tags)<=12),
 updated_at timestamptz not null default now(),
 primary key(user_id,article_id)
);
create table public.reader_cache (
 user_id uuid not null references auth.users(id) on delete cascade,
 article_id uuid not null references public.articles(id) on delete cascade,
 body text not null,
 content_status text not null check(content_status in ('full','partial','unverified')),
 checked_at timestamptz not null default now(),
 primary key(user_id,article_id)
);
alter table public.article_library enable row level security;
alter table public.reader_cache enable row level security;
revoke all on public.article_library, public.reader_cache from public,anon,authenticated;
grant all on public.article_library, public.reader_cache to service_role;
commit;
