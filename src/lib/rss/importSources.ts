import Parser from 'rss-parser'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const parser = new Parser({
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

export async function importSources() {
  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)

  if (!sources) return

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.rss_url)

      for (const item of feed.items.slice(0, 12)) {
        const title = item.title ?? 'Senza titolo'
        const link = item.link ?? ''
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
    } catch (error) {
      console.log('Errore feed:', source.name, error)
    }
  }
}