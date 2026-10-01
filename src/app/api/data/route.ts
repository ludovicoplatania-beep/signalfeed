import { NextResponse } from 'next/server'
import { getUpdate } from '@/lib/server/pipeline'
import { uniqueArticles } from '@/lib/articles/identity'
import { sourceSummary } from '@/lib/articles/summary'
import { apiError } from '@/lib/server/api'
import { requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'

function unwrapRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function GET(request: Request) {
  try {
    const owner = await requireOwner(request)
    const supabase = getServiceSupabase()
    const [sources, articles, picks, saved, topics, digests, feedback] = await Promise.all([
      supabase.from('sources')
        .select('id, name, website_url, rss_url, is_active, priority, last_checked_at, last_success_at, last_error, last_import_count, last_new_count, last_updated_count, resolved_feed_url')
        .eq('user_id', owner.id)
        .order('created_at', { ascending: false }),
      supabase.rpc('athena_home_feed', { p_user: owner.id }),
      supabase.from('ai_picks')
        .select('id, score, summary, reason, category, selection_method, created_at, articles!inner(id, title, url, excerpt, image_url, article_content, published_at, duplicate_of, sources!inner(name, is_active))')
        .eq('user_id', owner.id).eq('is_current', true)
        .eq('articles.sources.is_active', true).is('articles.duplicate_of', null)
        .order('selection_method').order('score', { ascending: false })
        .limit(20),
      supabase.from('saved_articles')
        .select('id, article_id, created_at, articles(duplicate_of, id, title, url, excerpt, image_url, article_content, published_at, sources(name))')
        .eq('user_id', owner.id)
        .order('created_at', { ascending: false }),
      supabase.from('trending_topics')
        .select('*')
        .eq('user_id', owner.id).eq('is_current', true)
        .order('score', { ascending: false })
        .limit(12),
      supabase.from('daily_digests')
        .select('*')
        .eq('user_id', owner.id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase.from('article_feedback').select('article_id, preference, title, source_name, updated_at').eq('user_id', owner.id).order('updated_at', { ascending: false }).limit(1000),
    ])

    const failed = [sources, articles, picks, saved, topics, digests, feedback].find((result) => result.error)
    if (failed?.error) throw failed.error

    const normalizedArticles = ((articles.data ?? []) as { id: string; title: string; url: string; sources: { name: string } | null }[]).map(
      ({ sources: relatedSources, ...article }) => ({
        ...article,
        sources: unwrapRelation(relatedSources),
      }),
    )
    const normalizedPicks = (picks.data ?? []).map(({ articles: relatedArticles, ...pick }) => {
      const article = unwrapRelation(relatedArticles)
      return {
        ...pick,
        summary: article ? sourceSummary(article) : '',
        articles: article ? { ...article, sources: unwrapRelation(article.sources) } : null,
      }
    }).filter((pick) => Boolean(pick.articles?.id && pick.articles.title))
    const aliases = (saved.data ?? []).map((entry) => unwrapRelation(entry.articles)?.duplicate_of).filter((id): id is string => Boolean(id))
    // Resolve saved aliases without deleting historical records.
    const { data: keepers, error: keeperError } = aliases.length
      ? await supabase.from('articles').select('id, title, url, excerpt, image_url, article_content, published_at, duplicate_of, sources(name)').in('id', aliases)
      : { data: [], error: null }
    if (keeperError) throw keeperError
    const replacements = new Map((keepers ?? []).map((article) => [article.id, article]))
    const normalizedSaved = (saved.data ?? []).map(({ articles: relatedArticles, ...entry }) => {
      const original = unwrapRelation(relatedArticles)
      const article = original?.duplicate_of ? replacements.get(original.duplicate_of) ?? original : original
      return {
        ...entry, article_id: article?.id ?? entry.article_id,
        articles: article ? { ...article, sources: unwrapRelation(article.sources) } : null,
      }
    }).filter((entry) => Boolean(entry.articles?.id && entry.articles.title))

    return NextResponse.json(
      {
        success: true,
        feedback: feedback.data ?? [],
        sources: (sources.data ?? []).map((source) => ({ ...source, is_stale: !source.last_success_at || Date.now() - new Date(source.last_success_at).getTime() > 36 * 3_600_000 })),
        articles: uniqueArticles(normalizedArticles),
        aiPicks: normalizedPicks,
        savedArticles: normalizedSaved.filter((entry, index, list) => list.findIndex((other) => other.article_id === entry.article_id) === index),
        update: await getUpdate(owner.id),
        trendingTopics: topics.data ?? [],
        digests: digests.data ?? [],
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    return apiError(error, 'Errore caricamento dati')
  }
}
