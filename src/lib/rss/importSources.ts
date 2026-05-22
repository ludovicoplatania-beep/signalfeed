import Parser from 'rss-parser'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'SignalFeed/1.0',
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

async function importSingleSource(source: any) {
  try {
    const feed = await parser.parseURL(source.rss_url)

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