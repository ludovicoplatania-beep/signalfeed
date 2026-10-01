import { NextResponse } from 'next/server'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'
import { sourceCatalog } from '@/lib/sources/catalog'
import { discoverFeed } from '@/lib/rss/discovery'
import { articleDate, isEditorialArticle } from '@/lib/articles/identity'

export const maxDuration = 180

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request)
    enforceRateLimit(`expand-sources:${owner.id}`, 3, 3_600_000)
    const supabase = getServiceSupabase()
    const { data: existing, error } = await supabase.from('sources').select('name, rss_url, website_url, resolved_feed_url').eq('user_id', owner.id)
    if (error) throw error
    const known = new Set((existing ?? []).flatMap(source => [source.rss_url, source.resolved_feed_url].filter(Boolean).map(url => url.replace(/\/$/, ''))))
    const reports: { name: string; status: 'added' | 'existing' | 'unavailable'; count?: number; message?: string }[] = []
    let cursor = 0
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (cursor < sourceCatalog.length) {
        const candidate = sourceCatalog[cursor++]
        if (known.has(candidate.feed.replace(/\/$/, '')) || existing?.some(source => source.name === candidate.name)) {
          reports.push({ name: candidate.name, status: 'existing' }); continue
        }
        try {
          const discovered = await discoverFeed({ id: 'catalog', user_id: owner.id, name: candidate.name, rss_url: candidate.feed, website_url: candidate.site, priority: 3, is_active: true }, AbortSignal.timeout(20_000))
          if (discovered.mode !== 'rss') throw new Error('Nessun feed RSS o Atom verificabile')
          const usable = discovered.items.filter(item => {
            try { return Boolean(item.title?.trim() && item.link && isEditorialArticle(new URL(item.link, discovered.url).toString())) } catch { return false }
          })
          if (!usable.length) throw new Error('Il feed non contiene articoli importabili')
          if (!usable.some(item => {
            const date = articleDate(item.isoDate || item.pubDate)
            return date && new Date(date).getTime() >= Date.now() - 14 * 86_400_000 && new Date(date).getTime() <= Date.now()
          })) throw new Error('Nessun articolo datato negli ultimi 14 giorni')
          const key = discovered.url.replace(/\/$/, '')
          if (known.has(key)) { reports.push({ name: candidate.name, status: 'existing' }); continue }
          const { error: saveError } = await supabase.rpc('athena_add_verified_source', { p_user: owner.id, p_name: candidate.name, p_site: candidate.site, p_feed: discovered.url, p_priority: 3 })
          if (saveError) throw saveError
          known.add(key)
          reports.push({ name: candidate.name, status: 'added', count: usable.length })
        } catch (failure) {
          reports.push({ name: candidate.name, status: 'unavailable', message: failure instanceof Error ? failure.message.slice(0, 200) : 'Fonte non verificabile' })
        }
      }
    }))
    return NextResponse.json({ success: true, added: reports.filter(report => report.status === 'added').length, reports }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, 'Ampliamento fonti non disponibile')
  }
}
