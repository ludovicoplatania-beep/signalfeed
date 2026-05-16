import Parser from 'rss-parser'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

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

async function extractArticleContent(url: string) {
  try {
    if (!url) return null

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SignalFeed/1.0; +https://signalfeed-qh1g.vercel.app)',
      },
    })

    if (!response.ok) return null

    const html = await response.text()
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article?.textContent) return null

    const cleanText = article.textContent
      .replace(/\s+/g, ' ')
      .trim()

    if (cleanText.length < 300) return null

    return cleanText
  } catch {
    return null
  }
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
        const excerpt =
          item.contentSnippet ??
          item.contentEncoded ??
          item.content ??
          ''
        const published = item.pubDate ?? null
        const image = getImage(item)
        const hash = makeHash(title + link)

        const articleContent = await extractArticleContent(link)

        await supabase.from('articles').upsert({
          source_id: source.id,
          title,
          url: link,
          excerpt,
          published_at: published,
          image_url: image,
          article_content: articleContent,
          hash,
        })
      }
    } catch (error) {
      console.log('Errore feed:', source.name)
    }
  }
}