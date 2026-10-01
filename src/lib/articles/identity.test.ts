import { describe, it, expect } from 'vitest'
import { articleDate, canonicalArticleUrl, uniqueArticles } from './identity'
describe('article identity', () => {
  it('ignores tracking, fragments, scheme and title changes', () => {
    expect(canonicalArticleUrl('http://www.example.com/news/?utm_source=x&fbclid=y#top')).toBe('https://example.com/news')
  })
  it('preserves identity query parameters', () => {
    expect(canonicalArticleUrl('https://example.com/?id=1')).not.toBe(canonicalArticleUrl('https://example.com/?id=2'))
  })
  it('rejects unsafe navigation URLs', () => {
    expect(() => canonicalArticleUrl('javascript:alert(1)')).toThrow()
    expect(() => canonicalArticleUrl('https://user:password@example.com/a')).toThrow()
  })
  it('keeps absent and invalid dates absent', () => {
    expect(articleDate()).toBeNull(); expect(articleDate('bad')).toBeNull()
    expect(articleDate('2099-01-01')).toBeNull()
    expect(articleDate('2020-01-01')).toBe('2020-01-01T00:00:00.000Z')
  })
  it('deduplicates repeated pagination results', () => {
    expect(uniqueArticles([{ id: 'a', url: 'https://example.com/a' }, { id: 'b', url: 'https://example.com/a?utm_source=rss' }])).toHaveLength(1)
  })
})
