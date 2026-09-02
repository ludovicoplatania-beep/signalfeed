import 'server-only'
import Parser from 'rss-parser'
import crypto from 'node:crypto'
import { sourceAdapters, type SourceRecord } from '@/lib/sources/adapters'
import { getServiceSupabase } from '@/lib/server/clients'
import { safeFetchText } from '@/lib/server/safeFetch'

type FeedItem = Parser.Item & {
  contentEncoded?: string
  mediaContent?: { $?: { url?: string }; url?: string }
  mediaThumbnail?: { $?: { url?: string }; url?: string }
}

const parser = new Parser<Record<string, unknown>, FeedItem>({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
})

function makeHash(text: string) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function cleanHtml(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20_000)
}

function getImage(item: FeedItem) {
  return item.enclosure?.url || item.mediaContent?.$?.url || item.mediaContent?.url ||
    item.mediaThumbnail?.$?.url || item.mediaThumbnail?.url || null
}

function normalizeUrl(url: string) {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

async function tryParseFeed(url: string) {
  try {
    const response = await safeFetchText(
      url,
      'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9',
    )
    const feed = await parser.parseString(response.text)
    if (feed.items?.length) return { url: response.url, feed }
  } catch (error) {
    console.warn('Feed candidate rejected:', url, error instanceof Error ? error.message : error)
  }
  return null
}

async function discoverFeed(source: SourceRecord) {
  const inputUrl = normalizeUrl(source.rss_url || source.website_url || '')
  if (!inputUrl) return null

  const adapter = sourceAdapters.find((candidate) => candidate.match(source))
  const normalizedBase = inputUrl.replace(/\/$/, '')
  const candidates = Array.from(new Set([
    ...(adapter?.feedUrls(source) ?? []), inputUrl, `${normalizedBase}/feed`,
    `${normalizedBase}/rss`, `${normalizedBase}/rss.xml`, `${normalizedBase}/feed.xml`,
    `${normalizedBase}/atom.xml`,
  ]))

  for (const candidate of candidates) {
    const result = await tryParseFeed(candidate)
    if (result) return result
  }

  try {
    const page = await safeFetchText(inputUrl, 'text/html,application/xhtml+xml')
    const tags = [...page.text.matchAll(/<link[^>]+>/gi)]
      .map((match) => match[0])
      .filter((tag) => /application\/(rss|atom)\+xml|text\/xml/i.test(tag))

    for (const tag of tags.slice(0, 10)) {
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
      if (!href) continue
      const result = await tryParseFeed(new URL(href, page.url).toString())
      if (result) return result
    }
  } catch (error) {
    console.warn('Feed discovery failed:', source.name, error instanceof Error ? error.message : error)
  }
  return null
}

async function importSingleSource(source: SourceRecord) {
  try {
    const discovered = await discoverFeed(source)
    if (!discovered) throw new Error('Nessun feed RSS/Atom valido trovato')

    let imported = 0
    for (const item of discovered.feed.items.slice(0, 6)) {
      const title = (item.title ?? 'Senza titolo').slice(0, 500)
      const link = item.link?.trim() ?? ''
      if (!link) continue

      const articleUrl = new URL(link, discovered.url)
      if (!['http:', 'https:'].includes(articleUrl.protocol)) continue

      const rawContent = item.contentEncoded || item.content || item.contentSnippet || ''
      const excerpt = cleanHtml(item.contentSnippet || rawContent).slice(0, 2_000)
      const articleContent = cleanHtml(rawContent || excerpt)
      const { error } = await getServiceSupabase().from('articles').upsert({
        source_id: source.id,
        title,
        url: articleUrl.toString(),
        excerpt,
        published_at: item.pubDate ?? null,
        image_url: getImage(item),
        article_content: articleContent || null,
        hash: makeHash(title + articleUrl.toString()),
      }, { onConflict: 'hash' })
      if (error) throw error
      imported += 1
    }

    return { source: source.name, success: true, count: imported, feedUrl: discovered.url }
  } catch (error) {
    return {
      source: source.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function importSources(userId?: string) {
  let query = getServiceSupabase().from('sources').select('*').eq('is_active', true)
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) throw error
  const sources = (data ?? []) as SourceRecord[]
  const results: Awaited<ReturnType<typeof importSingleSource>>[] = []

  for (let index = 0; index < sources.length; index += 4) {
    results.push(...await Promise.all(sources.slice(index, index + 4).map(importSingleSource)))
  }
  return results
}
