import { describe, it, expect } from 'vitest'
import { cleanHtml, discoveredLinks, publicPageItems } from './discovery'
describe('publisher discovery', () => {
  it('reads advertised relative Atom links', () => {
    expect(discoveredLinks('<link type="application/atom+xml" href="/news.atom">', 'https://example.com/news')).toEqual(['https://example.com/news.atom'])
  })
  it('cleans markup and script content', () => {
    expect(cleanHtml('<p>A &amp; B</p><script>danger</script>')).toBe('A & B')
  })
  it('extracts articles from JSON-LD graphs', () => {
    const html = '<script type="application/ld+json">' + JSON.stringify({ '@graph': [{ '@type': 'NewsArticle', headline: 'Una notizia importante', url: '/news/1', datePublished: '2020-01-01' }] }) + '</script>'
    expect(publicPageItems(html, 'https://example.com')[0]?.link).toBe('https://example.com/news/1')
  })
  it('uses semantic cards without inventing publication dates', () => {
    const items = publicPageItems('<article><h2><a href="/news/1">Una notizia importante per il futuro</a></h2></article>', 'https://example.com')
    expect(items).toHaveLength(1); expect(items[0].pubDate).toBeUndefined()
  })
  it('excludes navigation and external publishers', () => {
    expect(publicPageItems('<h2><a href="/category/news">Una categoria importante per il futuro</a></h2><h2><a href="https://other.com/news">Una notizia importante per il futuro</a></h2>', 'https://example.com')).toHaveLength(0)
  })
  it('deduplicates tracking variants in a page', () => {
    expect(publicPageItems('<h2><a href="/news/1">Una notizia importante per il futuro</a></h2><h2><a href="/news/1?utm_source=x">Una notizia importante per il futuro</a></h2>', 'https://example.com')).toHaveLength(1)
  })
})
