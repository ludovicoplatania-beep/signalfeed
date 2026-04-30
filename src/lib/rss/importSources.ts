import Parser from 'rss-parser'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const parser = new Parser()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function makeHash(text: string) {
  return crypto.createHash('sha256').update(text).digest('hex')
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

        const hash = makeHash(title + link)

        await supabase.from('articles').upsert({
          source_id: source.id,
          title,
          url: link,
          excerpt,
          published_at: published,
          hash,
        })
      }
    } catch (error) {
      console.log('Errore feed:', source.name)
    }
  }
}