import { describe, expect, it } from 'vitest'
import { groupStories, sameEvent, type StoryArticle } from './stories'
const article = (id: string, title: string, days = 0): StoryArticle => ({ id, title, url: `https://example.com/${id}`, sources: { name: id }, published_at: new Date(Date.now() - days * 86_400_000).toISOString() })
describe('event coverage grouping', () => {
  it('keeps alternate publishers addressable without modifying IDs', () => {
    const first = article('a', 'Catania apre nuovo museo archeologico nel centro storico')
    const second = article('b', 'Apre nuovo museo archeologico nel centro storico di Catania')
    const groups = groupStories([first, second])
    expect(groups).toHaveLength(1)
    expect(groups[0].article.id).toBe('a'); expect(groups[0].alternatives[0].id).toBe('b')
  })
  it('does not merge later developments or different numeric facts', () => {
    const a = article('a', 'Catania apre nuovo museo archeologico nel centro storico')
    expect(sameEvent(a, article('b', a.title, 3))).toBe(false)
    expect(sameEvent(article('c', 'Economia italiana cresce del 2 per cento trimestre'), article('d', 'Economia italiana cresce del 5 per cento trimestre'))).toBe(false)
  })
})
