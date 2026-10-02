import 'server-only'
import crypto from 'node:crypto'
import { articleDate, canonicalArticleUrl, isEditorialArticle } from '@/lib/articles/identity'
import type { SourceRecord } from '@/lib/sources/adapters'
import { getServiceSupabase } from '@/lib/server/clients'
import { discoverFeed, cleanHtml } from './discovery'
import { isSourceDue, recentIngestionLags } from './schedule'

export type SourceResult = {
  sourceId: string; source: string; success: boolean; count: number; newCount: number; updatedCount: number
  unchangedCount: number; durationMs?: number; ingestionLagSamplesMs?: number[]; error?: string; feedUrl?: string; mode?: 'rss' | 'html'
}

async function importSingleSource(source: SourceRecord, signal: AbortSignal): Promise<SourceResult> {
  const supabase = getServiceSupabase()
  const startedAt = Date.now()
  const checkedAt = new Date(startedAt).toISOString()
  try {
    const discovered = await discoverFeed(source, signal)
    const candidates = new Map<string, {
      canonical_url: string; source_id: string; title: string; url: string; excerpt: string
      article_content: string | null; published_at: string | null; image_url: string | null; hash: string
    }>()
    for (const item of discovered.items.slice(0, 100)) {
      if (!item.link || !item.title?.trim()) continue
      try {
        const url = new URL(item.link.trim(), discovered.url).toString()
        if (!isEditorialArticle(url)) continue
        const key = canonicalArticleUrl(url)
        if (candidates.has(key)) continue
        const content = cleanHtml(item.contentEncoded || item.content || item.contentSnippet || '')
        candidates.set(key, {
          source_id: source.id, canonical_url: key, title: cleanHtml(item.title, 500), url,
          excerpt: cleanHtml(item.contentSnippet || content, 2_000), article_content: content || null,
          published_at: articleDate(item.isoDate || item.pubDate),
          image_url: item.enclosure?.url || item.mediaContent?.$?.url || item.mediaContent?.url || item.mediaThumbnail?.$?.url || null,
          hash: crypto.createHash('sha256').update(key).digest('hex'),
        })
      } catch { /* One invalid item must not discard the rest of the feed. */ }
    }
    if (!candidates.size) throw new Error('Fonte raggiungibile, nessun articolo importabile')
    signal.throwIfAborted()
    // Capture identities before the atomic import so unchanged feed items do not
    // inflate the publish-to-first-import delay. Metrics failures do not block news.
    const { data: previous, error: metricError } = await supabase.from('articles')
      .select('canonical_url').in('canonical_url', [...candidates.keys()])
    const existing = new Set((previous ?? []).map(article => article.canonical_url))
    const newlySeen = [...candidates.values()].filter(article => !existing.has(article.canonical_url))
    signal.throwIfAborted()
    const { data: counts, error: ingestError } = await supabase.rpc('athena_ingest_articles', {
      p_source: source.id, p_articles: [...candidates.values()],
    })
    if (ingestError) throw ingestError
    const { newCount, updatedCount, unchangedCount } = counts as { newCount: number; updatedCount: number; unchangedCount: number }
    const ingestionLagSamplesMs = !metricError && newlySeen.length === newCount
      ? recentIngestionLags(newlySeen.map(article => article.published_at)) : []
    const durationMs = Date.now() - startedAt
    console.info('Source freshness', { sourceId: source.id, durationMs, newCount, ingestionLagSamplesMs })
    const { error: healthError } = await supabase.from('sources').update({
      last_checked_at: checkedAt, last_success_at: new Date().toISOString(), last_error: null,
      last_import_count: candidates.size, last_new_count: newCount, last_updated_count: updatedCount,
      resolved_feed_url: discovered.mode === 'rss' ? discovered.url : null,
    }).eq('id', source.id)
    if (healthError) throw healthError
    return { sourceId: source.id, source: source.name, success: true, count: candidates.size,
      newCount, updatedCount, unchangedCount, durationMs, ingestionLagSamplesMs, feedUrl: discovered.url, mode: discovered.mode }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const { error: healthError } = await supabase.from('sources').update({
      last_checked_at: checkedAt, last_error: message.slice(0, 500), last_import_count: 0, last_new_count: 0, last_updated_count: 0,
    }).eq('id', source.id)
    if (healthError) throw healthError
    console.warn('Source import failed:', source.name, message)
    return { sourceId: source.id, source: source.name, success: false, count: 0, newCount: 0, updatedCount: 0, unchangedCount: 0, durationMs: Date.now() - startedAt, error: message }
  }
}

export async function repairArticleIdentities(userId: string) {
  const supabase = getServiceSupabase()
  let repaired = 0
  while (true) {
    const { data, error } = await supabase.from('articles').select('id, url, sources!inner(user_id)')
      .eq('sources.user_id', userId).is('canonical_url', null).is('duplicate_of', null).order('id').limit(500)
    if (error) throw error
    if (!data?.length) break
    const entries = data.map((article) => {
      let key: string
      try { key = canonicalArticleUrl(article.url) } catch { key = `legacy:${article.id}` }
      return { id: article.id, key }
    })
    const { error: repairError } = await supabase.rpc('athena_repair_articles', { p_entries: entries })
    if (repairError) throw repairError
    repaired += entries.length
  }
  return repaired
}

export async function importSources(userId: string, options: { dueOnly?: boolean } = {}) {
  const { data, error } = await getServiceSupabase().from('sources').select('*').eq('is_active', true).eq('user_id', userId)
    .order('last_checked_at', { ascending: true, nullsFirst: true }).order('priority', { ascending: false })
  if (error) throw error
  const active = (data ?? []) as SourceRecord[]
  const now = Date.now()
  const sources = options.dueOnly ? active.filter(source => isSourceDue(source, now)) : active
  const results: SourceResult[] = []
  const overall = AbortSignal.timeout(170_000)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(8, sources.length) }, async () => {
    while (cursor < sources.length) {
      const source = sources[cursor++]
      if (overall.aborted) {
        results.push({ sourceId: source.id, source: source.name, success: false, count: 0, newCount: 0, updatedCount: 0, unchangedCount: 0,
          error: 'Controllo rinviato al prossimo aggiornamento: tempo disponibile esaurito' })
        continue
      }
      results.push(await importSingleSource(source, AbortSignal.any([overall, AbortSignal.timeout(22_000)])))
    }
  }))
  return results
}
