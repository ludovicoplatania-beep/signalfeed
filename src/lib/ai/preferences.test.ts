import { describe, expect, it } from 'vitest'
import { preferenceAdjustment, type Feedback } from './preferences'
import { automaticPicks, picksWithDiscovery, type Candidate } from './ranking'
const article = (id: string, source = id, title = `Notizia specifica ${id}`): Candidate => ({ id, title, excerpt: null, url: `https://example.com/${id}`, source_id: source, source_name: source, source_priority: 3, published_at: new Date().toISOString(), created_at: new Date().toISOString(), article_content: null })
const feedback = (a: Candidate, preference: Feedback['preference']): Feedback => ({ ...a, article_id: a.id, preference, updated_at: new Date().toISOString() })

describe('explicit preferences and discovery', () => {
  it('gives a like more weight than a read and applies it to related topics', () => {
    const a = article('a', 'known', 'Nuovo modello OpenAI migliora ragionamento matematico')
    const b = article('b', 'other', 'OpenAI presenta modello avanzato per ragionamento matematico')
    const unrelated = article('c', 'news', 'Nuovo incendio distrugge bosco vicino Catania')
    const votes = [feedback(a, 'like')]
    expect(preferenceAdjustment(b, votes)).toBe(25)
    expect(preferenceAdjustment(unrelated, votes)).toBe(0)
    expect(automaticPicks([a, unrelated], [], new Set(['a']), votes)[0].id).toBe('a')
  })
  it('distinguishes reduced topics from reduced sources and ignores undone votes', () => {
    const a = article('a', 'known', 'OpenAI presenta nuovo modello matematico')
    const b = article('b', 'known', 'Incendio a Catania evacuate tre famiglie')
    expect(preferenceAdjustment(b, [feedback(a, 'less_topic')])).toBe(0)
    expect(preferenceAdjustment(b, [feedback(a, 'less_source')])).toBe(-60)
    expect(preferenceAdjustment(a, [feedback(a, null)])).toBe(0)
  })
  it('reserves two discovery slots without read, old or disliked-source articles', () => {
    const articles = Array.from({ length: 14 }, (_, i) => article(String(i), i < 10 ? 'known' : `new${i}`))
    articles[10].published_at = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const read = new Set(['11'])
    const picks = picksWithDiscovery(automaticPicks(articles, [], read), articles, new Set(['known']), read)
    expect(picks).toHaveLength(10)
    expect(picks.filter(pick => pick.reason.startsWith('Scoperta')).map(pick => pick.id).sort()).toEqual(['12', '13'])
  })
  it('never repeats a rejected article and never prioritizes a reduced source over available choices', () => {
    const articles = Array.from({ length: 12 }, (_, i) => article(String(i)))
    const votes = [feedback(articles[0], 'less_source'), feedback(articles[1], 'less_topic')]
    const proposed = automaticPicks(articles, [], new Set()).map(pick => ({ ...pick, selection_method: 'ai' as const }))
    const picks = picksWithDiscovery(proposed, articles, new Set(), new Set(), votes)
    expect(picks).toHaveLength(10)
    expect(picks.some(pick => ['0', '1'].includes(pick.id))).toBe(false)
  })
})
