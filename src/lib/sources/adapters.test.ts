import { describe, expect, it } from 'vitest'
import { sourceAdapters, type SourceRecord } from './adapters'
import { publicPageItems } from '@/lib/rss/discovery'
const source = (name: string): SourceRecord => ({ id: 'source', user_id: 'owner', name, rss_url: '', website_url: null, is_active: true, priority: 3 })
describe('publisher paths', () => {
  it.each([
    ['Quattroruote', 'https://www.quattroruote.it/news/', '/news/industria-finanza/2026/09/30/gruppo_bmw_piano_prodotti_obiettivi.html'],
    ['Slow News slow-news', 'https://slow-news.com/stream', '/stream/tre-ipotesi-sulla-morte-di-giuseppe-pinelli'],
    ['MyMovies', 'https://www.mymovies.it/cinemanews/', '/cinemanews/2026/195902/'],
    ['Cycle World cycleworld', 'https://www.cycleworld.com/latest/', '/bikes/moto-morini-vettore-450-dyno-test-2026/'],
  ])('extracts verified article paths for %s', (name, page, path) => {
    const adapter = sourceAdapters.find(a => a.match(source(name)))!
    expect(publicPageItems(`<a href="${path}">Una notizia importante con un titolo abbastanza lungo</a>`, page, adapter.articlePattern)).toHaveLength(1)
  })
  it('uses the publisher-advertised Serial TV RSS endpoint', () => {
    const adapter = sourceAdapters.find(a => a.match(source('Everyeye Serie TV')))!
    expect(adapter.feedUrls(source('Everyeye Serie TV'))).toEqual(['https://serial.everyeye.it/feed/feed_news_rss.asp'])
  })
})
