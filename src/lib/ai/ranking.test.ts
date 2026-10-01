import { describe, it, expect } from 'vitest'
import { balancedCandidates, diversifyPicks, automaticPicks, sameStory, type Candidate } from './ranking'
const article = (id: string, source = 's', title = `Notizia ${id} su tecnologia e sviluppo`) : Candidate => ({ id, source_id: source, source_name: source, source_priority: 3, title, url: `https://example.com/${id}`, excerpt: null, article_content: null, published_at: new Date().toISOString(), created_at: new Date().toISOString() })
describe('balanced ranking', () => {
  it('represents low-volume sources within a bounded pool', () => {
    const result = balancedCandidates([Array.from({ length: 150 }, (_, i) => article(String(i))), [article('other', 'small')]], 120)
    expect(result).toHaveLength(120); expect(result.some(a => a.source_id === 'small')).toBe(true)
  })
  it('fills ten picks even with a single source and category', () => {
    const articles = Array.from({ length: 10 }, (_, i) => article(String(i)))
    expect(diversifyPicks(automaticPicks(articles, [], new Set()), articles)).toHaveLength(10)
  })
  it('does not equate different numeric news', () => {
    expect(sameStory(article('1', 's', 'Il mercato cresce del 2 per cento nel trimestre'), article('2', 's', 'Il mercato cresce del 5 per cento nel trimestre'))).toBe(false)
  })
  it('groups the same story across publishers', () => {
    expect(sameStory(article('a', 's', 'Nuova missione spaziale raggiunge la luna oggi'), article('b', 't', 'Nuova missione spaziale raggiunge la luna oggi'))).toBe(true)
  })
  it('uses source priority and penalizes already-read articles', () => {
    const a = article('a'); const b = article('b'); b.source_priority = 5
    const picks = automaticPicks([a, b], [], new Set(['a']))
    expect(picks[0].id).toBe('b'); expect(picks.every(p => p.selection_method === 'automatic')).toBe(true)
  })
})
