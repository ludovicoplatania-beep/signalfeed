import Parser from 'rss-parser'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    Accept:
      'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9,*/*;q=0.8',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

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
}

function getImage(item: any) {
  return (
    item.enclosure?.url ||
    item.mediaContent?.$?.url ||
    item.mediaContent?.url ||
    item.mediaThumbnail?.$?.url ||
    item.mediaThumbnail?.url ||
    null
  )
}

function normalizeUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

function absoluteUrl(base: string, href: string) {
  try {
    return new URL(href, base).toString()
  } catch {
    return href
  }
}

async function discoverFeedUrl(inputUrl: string) {
  const url = normalizeUrl(inputUrl)

  const candidates = [
    url,
    `${url.replace(/\/$/, '')}/feed`,
    `${url.replace(/\/$/, '')}/rss`,
    `${url.replace(/\/$/, '')}/rss.xml`,
    `${url.replace(/\/$/, '')}/feed.xml`,
    `${url.replace(/\/$/, '')}/atom.xml`,
  ]

  for (const candidate of candidates) {
    try {
      await parser.parseURL(candidate)
      return candidate
    } catch {}
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) return null

    const html = await response.text()

    const links = [...html.matchAll(/<link[^>]+>/gi)]
      .map((match) => match[0])
      .filter((tag) =>
        /application\/(rss|atom)\+xml|text\/xml/i.test(tag)
      )

    for (const tag of links) {
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
      if (!hrefMatch?.[1]) continue

      const feedUrl = absoluteUrl(url, hrefMatch[1])

      try {
        await parser.parseURL(feedUrl)
        return feedUrl
      } catch {}
    }
  } catch {}

  return null
}

async function importSingleSource(source: any) {
  try {
    const feedUrl =
      source.rss_url && source.rss_url.includes('xml')
        ? source.rss_url
        : (await discoverFeedUrl(source.rss_url || source.website_url))

    if (!feedUrl) {
      throw new Error('Nessun feed RSS/Atom trovato')
    }

    const feed = await parser.parseURL(feedUrl)
    const items = feed.items.slice(0, 6)

    for (const item of items) {
      const title = item.title ?? 'Senza titolo'
      const link = item.link ?? ''

      if (!link) continue

      const rawContent =
        (item as any).contentEncoded ||
        item.content ||
        item.contentSnippet ||
        ''

      const excerpt = cleanHtml(item.contentSnippet || rawContent || '')
      const articleContent = cleanHtml(rawContent || excerpt)
      const published = item.pubDate ?? null
      const image = getImage(item)
      const hash = makeHash(title + link)

      await supabase.from('articles').upsert({
        source_id: source.id,
        title,
        url: link,
        excerpt,
        published_at: published,
        image_url: image,
        article_content: articleContent || null,
        hash,
      })
    }

    return {
      source: source.name,
      success: true,
      count: items.length,
      feedUrl,
    }
  } catch (error: any) {
    console.log('Errore feed:', source.name, error?.message ?? error)

    return {
      source: source.name,
      success: false,
      error: error?.message ?? 'Unknown error',
    }
  }
}

export async function importSources() {
  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)

  if (!sources?.length) return []

  const results = []

  for (let i = 0; i < sources.length; i += 4) {
    const batch = sources.slice(i, i + 4)
    const batchResults = await Promise.all(
      batch.map((source) => importSingleSource(source))
    )

    results.push(...batchResults)
  }

  return results
}