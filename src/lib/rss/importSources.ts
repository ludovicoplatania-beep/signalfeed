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

export async function importSources() {
  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)

  if (!sources) return

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.rss_url)

      for (const item of feed.items.slice(0, 20)) {
        const title = item.title ?? 'Senza titolo'
        const link = item.link ?? ''
        const excerpt = item.contentSnippet ?? ''
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
          hash,
        })
      }
    } catch (error) {
      console.log('Errore feed:', source.name)
    }
  }
}