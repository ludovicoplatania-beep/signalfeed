begin;

-- La PWA monoutente usa esclusivamente il client server-side con service role.
-- Nessuna tabella applicativa deve essere raggiungibile direttamente dal browser.
revoke all on table public.sources from anon, authenticated;
revoke all on table public.articles from anon, authenticated;
revoke all on table public.saved_articles from anon, authenticated;
revoke all on table public.ai_picks from anon, authenticated;
revoke all on table public.daily_digests from anon, authenticated;
revoke all on table public.user_events from anon, authenticated;
revoke all on table public.user_interests from anon, authenticated;
revoke all on table public.trending_topics from anon, authenticated;

commit;
