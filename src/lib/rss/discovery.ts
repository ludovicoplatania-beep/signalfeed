import Parser from 'rss-parser'
import { load } from 'cheerio'
import { articleDate, canonicalArticleUrl } from '@/lib/articles/identity'
import { sourceAdapters, type SourceRecord } from '@/lib/sources/adapters'
import { safeFetchText } from '@/lib/server/safeFetch'

export type FeedItem = Parser.Item & {
  contentEncoded?: string
  mediaContent?: { $?: { url?: string }; url?: string }
  mediaThumbnail?: { $?: { url?: string }; url?: string }
}
const parser = new Parser<Record<string, unknown>, FeedItem>({
  customFields: { item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail'], ['content:encoded', 'contentEncoded']] },
})

export function cleanHtml(text: string, limit = 20_000) {
  const $ = load(text)
  $('script,style,noscript').remove()
  return $.text().replace(/\s+/g, ' ').trim().slice(0, limit)
}

export function discoveredLinks(html: string, base: string) {
  const $ = load(html)
  const links: string[] = []
  $('link[href], a[href]').each((_, element) => {
    const href = $(element).attr('href') ?? ''
    const type = $(element).attr('type') ?? ''
    if (/application\/(rss|atom)\+xml/i.test(type) || /(?:rss|atom|feed)(?:[/.?_-]|$)/i.test(href)) {
      try {
        const url = new URL(href, base)
        if (['http:', 'https:'].includes(url.protocol)) links.push(url.toString())
      } catch { /* Invalid publisher link. */ }
    }
  })
  return [...new Set(links)].slice(0, 12)
}

export function publicPageItems(html: string, base: string, pattern?: RegExp): FeedItem[] {
  const $ = load(html)
  const items: FeedItem[] = []
  function collect(value: unknown, depth = 0) {
    if (depth > 8 || !value || typeof value !== 'object') return
    if (Array.isArray(value)) { value.forEach((item) => collect(item, depth + 1)); return }
    const node = value as Record<string, unknown>
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']]
    if (types.some((type) => ['NewsArticle', 'Article', 'BlogPosting'].includes(String(type)))) {
      const link = typeof node.url === 'string' ? node.url : undefined
      if (link && typeof node.headline === 'string') {
        items.push({ title: node.headline, link, pubDate: articleDate(String(node.datePublished ?? '')) ?? undefined,
          contentSnippet: typeof node.description === 'string' ? node.description : '' })
      }
    }
    for (const [key, entry] of Object.entries(node)) if (!key.startsWith('@') || key === '@graph') collect(entry, depth + 1)
  }
  $('script[type="application/ld+json"]').each((_, element) => {
    try { collect(JSON.parse($(element).text())) } catch { /* Ignore malformed structured data. */ }
  })
  {
    // Restrict extraction to explicit publisher article paths, never generic navigation.
    $(pattern ? 'a[href]' : 'article a[href], h2 a[href], h3 a[href]').each((_, element) => {
      try {
        const link = new URL($(element).attr('href')!, base)
        const origin = new URL(base)
        if (link.hostname.replace(/^www\./, '') !== origin.hostname.replace(/^www\./, '') || (pattern && !pattern.test(link.pathname)) || /\/(tag|category|categorie|login|account|shop)(?:\/|$)/i.test(link.pathname)) return
        const title = cleanHtml($(element).attr('title') || $(element).text(), 500)
        if (title.length < 24) return
        const container = $(element).closest('article, li, .card, .news-item')
        const date = articleDate(container.find('time[datetime]').first().attr('datetime'))
        const image = container.find('img').first().attr('src')
        items.push({ title, link: link.toString(), pubDate: date ?? undefined,
          contentSnippet: '', enclosure: image ? { url: new URL(image, base).toString() } : undefined })
      } catch { /* Skip invalid links. */ }
    })
  }
  const seen = new Set<string>()
  return items.filter((item) => {
    try {
      const link = new URL(item.link!, base)
      if (link.hostname.replace(/^www\./, '') !== new URL(base).hostname.replace(/^www\./, '')) return false
      const key = canonicalArticleUrl(link.toString())
      if (seen.has(key)) return false
      seen.add(key); item.link = link.toString(); return true
    } catch { return false }
  }).slice(0, 100)
}

export async function discoverFeed(source: SourceRecord, signal: AbortSignal) {
  const adapter = sourceAdapters.find((entry) => entry.match(source))
  const input = source.rss_url || source.website_url
  if (!input) throw new Error('URL della fonte mancante')
  const root = new URL(source.website_url || input).origin
  const tried = new Set<string>()
  const blocked = new Set<string>()
  const htmlPages = new Map<string, string>()
  const errors: string[] = []
  async function read(url: string) {
    signal.throwIfAborted()
    if (tried.has(url) || blocked.has(new URL(url).origin)) return null
    tried.add(url)
    try {
      const page = await safeFetchText(url, 'application/rss+xml,application/atom+xml,application/xml,text/html;q=0.8', signal)
      if (/<(?:rss\b|feed\b|rdf:RDF\b)/i.test(page.text)) {
        const xml = page.text.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;')
        const feed = await parser.parseString(xml)
        if (feed.items?.length) return { url: page.url, items: feed.items, mode: 'rss' as const }
        errors.push('Feed valido ma vuoto')
      } else if (/<(?:html|head|body)\b/i.test(page.text)) htmlPages.set(page.url, page.text)
    } catch (error) {
      if (signal.aborted) throw error
      const message = error instanceof Error ? error.message : String(error)
      errors.push(message)
      if (/HTTP (403|429)/.test(message)) blocked.add(new URL(url).origin)
    }
    return null
  }
  for (const url of [...new Set([source.resolved_feed_url, source.rss_url, ...(adapter?.feedUrls(source) ?? [])].filter((url): url is string => Boolean(url)))]) {
    const result = await read(url)
    if (result) return result
  }
  for (const url of [...new Set([...(adapter?.pageUrls ?? []), source.website_url, root].filter((url): url is string => Boolean(url)))]) {
    const result = await read(url)
    if (result) return result
    for (const [pageUrl, html] of htmlPages) {
      for (const feedUrl of discoveredLinks(html, pageUrl)) {
        const feed = await read(feedUrl)
        if (feed) return feed
      }
    }
  }
  for (const [url, html] of htmlPages) {
    const items = adapter?.pageKind === 'cassazione-penale' ? cassazionePageItems(html, url) : publicPageItems(html, url, adapter?.articlePattern)
    if (items.length) return { url, items, mode: 'html' as const }
  }
  for (const path of ['/feed', '/rss.xml', '/atom.xml']) {
    const result = await read(new URL(path, root).toString())
    if (result) return result
  }
  if (blocked.size) throw new Error('La fonte rifiuta le richieste (403/429). Serve un feed pubblico consentito.')
  throw new Error(`Nessun feed o elenco pubblico utilizzabile. ${[...new Set(errors)].slice(0, 3).join(' · ')}`)
}

/** Official court cards: hearing dates are not publication dates. */
export function cassazionePageItems(html: string, base: string): FeedItem[] {
  const $ = load(html)
  const items: FeedItem[] = []
  const seen = new Set<string>()
  $('.card-news').each((_, card) => {
    const heading = $(card).find('h3 a[href]').first()
    try {
      const link = new URL(heading.attr('href') ?? '', base)
      if (link.hostname !== 'www.cortedicassazione.it' || !/^\/it\/(penale_dettaglio|qsp_dettaglio)\.page$/.test(link.pathname) || !/^(SZP|QSP)\d+$/.test(link.searchParams.get('contentId') ?? '')) return
      const title = heading.text().replace(/\s+/g, ' ').trim()
      if (title.length < 15 || seen.has(link.toString())) return
      const rawDate = $(card).find('.visually-hidden').text().match(/del\s+(\d{2})\/(\d{2})\/(\d{2}|\d{4})\s*$/)
      let date: string | undefined
      if (rawDate) {
        const year = rawDate[3].length === 2 ? '20' + rawDate[3] : rawDate[3]
        const iso = year + '-' + rawDate[2] + '-' + rawDate[1]
        const parsed = articleDate(iso)
        if (parsed?.startsWith(iso)) date = parsed
      }
      seen.add(link.toString())
      items.push({ title, link: link.toString(), pubDate: date, contentSnippet: $(card).find('.card-main p').text().replace(/\s+/g, ' ').trim() })
    } catch { /* Invalid official card. */ }
  })
  return items.slice(0, 100)
}
