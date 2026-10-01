import { describe, expect, it } from 'vitest'
import { selectionArticles, selectionFormat } from './selectionInput'
import type { Candidate } from './ranking'
describe('compact selection input', () => {
  it('keeps all publishers and explicit affinities without repeating full content', () => {
    const articles: Candidate[] = Array.from({ length: 120 }, (_, index) => ({
      id: String(index), title: `Notizia ${index}`, source_id: String(index), source_name: `Fonte ${index}`, source_priority: 3,
      url: `https://example.com/${index}`, excerpt: 'x'.repeat(1_000), article_content: 'y'.repeat(10_000),
      published_at: new Date().toISOString(), created_at: new Date().toISOString(),
    }))
    const input = selectionArticles(articles, new Set(['0']), [{ article_id: '0', preference: 'like', title: articles[0].title, excerpt: '', source_id: '0', source_name: 'Fonte 0', updated_at: new Date().toISOString() }])
    expect(input).toHaveLength(120)
    expect(input[0]).toMatchObject({ ref: 1, already_read: true, explicit_affinity: 25 })
    expect(input[119].source).toBe('Fonte 119')
    expect(JSON.stringify(input).length).toBeLessThan(70_000)
    expect(JSON.stringify(input)).not.toContain('yyyy')
  })
  it('limits generated references to available articles', () => {
    const schema = selectionFormat(3).json_schema.schema.properties.picks
    expect(schema.minItems).toBe(3)
    expect(schema.items.properties.ref.enum).toEqual([1, 2, 3])
    expect(schema.items.additionalProperties).toBe(false)
  })
})
