import { NextResponse } from 'next/server'
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
    const [sources, articles, picks, saved, topics, digests] = await Promise.all([
      supabase.from('sources')
        .select('id, name, website_url, rss_url, is_active, priority')
        .eq('user_id', owner.id)
        .order('created_at', { ascending: false }),
      supabase.from('articles')
        .select('id, title, url, excerpt, image_url, article_content, published_at, sources!inner(name, user_id)')
        .eq('sources.user_id', owner.id)
        .order('published_at', { ascending: false })
        .limit(100),
      supabase.from('ai_picks')
        .select('id, score, summary, reason, category, created_at, articles(id, title, url, excerpt, image_url, article_content, published_at, sources(name))')
        .eq('user_id', owner.id)
        .order('score', { ascending: false })
        .limit(20),
      supabase.from('saved_articles')
        .select('id, article_id, created_at, articles(id, title, url, excerpt, image_url, article_content, published_at, sources(name))')
        .eq('user_id', owner.id)
        .order('created_at', { ascending: false }),
      supabase.from('trending_topics')
        .select('*')
        .eq('user_id', owner.id)
        .order('score', { ascending: false })
        .limit(12),
      supabase.from('daily_digests')
        .select('*')
        .eq('user_id', owner.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    const failed = [sources, articles, picks, saved, topics, digests].find((result) => result.error)
    if (failed?.error) throw failed.error

    const normalizedArticles = (articles.data ?? []).map(
      ({ sources: relatedSources, ...article }) => ({
        ...article,
        sources: unwrapRelation(relatedSources),
      }),
    )
    const normalizedPicks = (picks.data ?? []).map(({ articles: relatedArticles, ...pick }) => {
      const article = unwrapRelation(relatedArticles)
      return {
        ...pick,
        articles: article ? { ...article, sources: unwrapRelation(article.sources) } : null,
      }
    }).filter((pick) => Boolean(pick.articles?.id && pick.articles.title))
    const normalizedSaved = (saved.data ?? []).map(({ articles: relatedArticles, ...entry }) => {
      const article = unwrapRelation(relatedArticles)
      return {
        ...entry,
        articles: article ? { ...article, sources: unwrapRelation(article.sources) } : null,
      }
    }).filter((entry) => Boolean(entry.articles?.id && entry.articles.title))

    return NextResponse.json(
      {
        success: true,
        sources: sources.data ?? [],
        articles: normalizedArticles,
        aiPicks: normalizedPicks,
        savedArticles: normalizedSaved,
        trendingTopics: topics.data ?? [],
        digests: digests.data ?? [],
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    return apiError(error, 'Errore caricamento dati')
  }
}
