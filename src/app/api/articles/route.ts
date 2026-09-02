import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/server/api'
import { requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'

const searchSchema = z.object({
  q: z.string().trim().max(120).default(''),
  source: z.string().uuid().optional(),
  period: z.enum(['all', 'day', 'week', 'month']).default('all'),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
}).strict()

function since(period: 'all' | 'day' | 'week' | 'month') {
  if (period === 'all') return null
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

export async function GET(request: Request) {
  try {
    const owner = await requireOwner(request)
    const url = new URL(request.url)
    const input = searchSchema.parse(Object.fromEntries(url.searchParams))
    let query = getServiceSupabase().from('articles')
      .select('id, title, url, excerpt, image_url, article_content, published_at, source_id, sources!inner(name, user_id)', { count: 'exact' })
      .eq('sources.user_id', owner.id)
      .order('published_at', { ascending: false })
      .range(input.offset, input.offset + 49)

    if (input.q) {
      const safe = input.q.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim()
      if (safe) query = query.or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`)
    }
    if (input.source) query = query.eq('source_id', input.source)
    const date = since(input.period)
    if (date) query = query.gte('published_at', date)

    const { data, error, count } = await query
    if (error) throw error
    const articles = (data ?? []).map(({ sources, ...article }) => ({
      ...article,
      sources: Array.isArray(sources) ? (sources[0] ?? null) : sources,
    }))
    return NextResponse.json({ success: true, articles, total: count ?? 0, nextOffset: input.offset + articles.length })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Filtri non validi' }, { status: 400 })
    }
    return apiError(error, 'Errore ricerca archivio')
  }
}
