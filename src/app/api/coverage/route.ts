import { NextResponse } from 'next/server'
import { apiError } from '@/lib/server/api'
import { requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'
import { benchmarkCutoff, evaluateCoverage, type CoverageArticle } from '@/lib/coverage/benchmark'

export async function GET(request: Request) {
  try {
    const owner = await requireOwner(request)
    const articles: CoverageArticle[] = []
    const scanStartedAt = new Date().toISOString()
    const supabase = getServiceSupabase()
    // Stable pagination; refuse a partial result instead of presenting a misleading score.
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('articles')
        .select('id,title,url,excerpt,published_at,created_at,sources!inner(user_id,is_active)')
        .eq('sources.user_id', owner.id).eq('sources.is_active', true).is('duplicate_of', null)
        .lte('created_at', scanStartedAt)
        .or(`and(published_at.gte.2026-09-23T00:00:00Z,published_at.lte.${benchmarkCutoff}),and(published_at.is.null,created_at.gte.2026-09-23T00:00:00Z,created_at.lte.${benchmarkCutoff})`)
        .order('id').range(offset, offset + 999)
      if (error) throw error
      articles.push(...(data ?? []))
      if (!data || data.length < 1000) break
      if (offset >= 19_000) throw new Error('Campione troppo grande: verifica incompleta, nessun punteggio pubblicato')
    }
    return NextResponse.json({ success: true, ...evaluateCoverage(articles) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return apiError(error, 'Verifica della copertura non riuscita') }
}
