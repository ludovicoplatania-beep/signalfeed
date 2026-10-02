import { describe, it, expect } from 'vitest'
import { balancedCandidates, diversifyPicks, automaticPicks, sameStory, categoryFor, selectionPool, picksWithDiscovery, type Candidate } from './ranking'
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

// Regression cases observed in the production feed; assess content, never the publisher name.
describe('editorial relevance regressions', () => {
  it('does not mistake the Italian preposition ai for artificial intelligence or trust a wrong model label', () => {
    expect(categoryFor(article('a', 'OpenAI', 'Il Comune risponde ai cittadini'), 'Intelligenza artificiale')).not.toBe('Intelligenza artificiale')
    expect(categoryFor(article('b', 'MIT AI', 'Una serie di strane intrusioni nelle case dei parlamentari finlandesi'), 'Intelligenza artificiale')).not.toBe('Intelligenza artificiale')
    expect(categoryFor(article('c', 'Guardian', 'Britain in talks with European allies over release of emergency diesel stockpiles'), 'Intelligenza artificiale')).not.toBe('Intelligenza artificiale')
    expect(categoryFor(article('d', 'MIT', 'MIT Transit Lab to develop an AI platform for public transit agencies'))).toBe('Intelligenza artificiale')
  })
  it('recognizes gaming, justice and local news independently of the model label', () => {
    expect(categoryFor(article('a', 's', 'Nintendo annuncia un nuovo videogioco'))).toBe('Videogiochi')
    expect(categoryFor(article('b', 's', 'Cassazione: nuova sentenza sul processo penale'))).toBe('Diritto e giustizia')
    expect(categoryFor(article('c', 's', 'Università di Catania e rinnovabili nel mix energetico'), 'Intelligenza artificiale')).toBe('Sicilia e Catania')
  })
  it('ranks relevant unread news ahead of general-interest AI recommendations', () => {
    const relevant = article('a', 'tech', 'OpenAI presenta un nuovo modello linguistico')
    const general = article('b', 'news', 'Un insetto gigante ha ingannato gli studiosi')
    const picks = automaticPicks([relevant, general], [], new Set())
    const ranked = picksWithDiscovery(picks.map(p => p.id === 'b' ? {...p, score: 100, selection_method: 'ai'} : p), [relevant,general], new Set(), new Set(), [], 2)
    expect(ranked[0].id).toBe('a')
  })
  it('excludes opened stories when ten distinct unread alternatives exist, even with a high AI score', () => {
    const items = Array.from({length: 11}, (_, i) => article(String(i), String(i), `OpenAI modello versione ${i}`))
    const reads = new Set(['0'])
    const picks = picksWithDiscovery(automaticPicks(items, [], reads).map(p => ({...p, score: 100, selection_method: 'ai'})), items, new Set(), reads)
    expect(picks).toHaveLength(10)
    expect(picks.some(p => p.id === '0')).toBe(false)
  })
  it('does not treat undated imports or promotional headlines as fresh editorial news', () => {
    const current = article('current', 's', 'Software migliora la sicurezza informatica')
    const undated = {...article('undated', 's', 'Software migliora la sicurezza informatica'), published_at: null}
    const ad = article('ad', 's', 'Software: codice sconto e offerta lampo')
    expect(automaticPicks([undated, ad, current], [], new Set())[0].id).toBe('current')
  })
  it('keeps multiple relevant records from a source and bounds the input deterministically', () => {
    const items = Array.from({length: 200}, (_, i) => article(String(i), String(i % 50), `Software versione ${i}`))
    const pool = selectionPool(items, [], new Set(), [], 160)
    expect(pool).toHaveLength(160)
    expect(pool.filter(p => p.source_id === pool[0].source_id).length).toBeGreaterThan(1)
    expect(selectionPool([...items].reverse(), [], new Set(), [], 160).map(p => p.id)).toEqual(pool.map(p => p.id))
  })
})
