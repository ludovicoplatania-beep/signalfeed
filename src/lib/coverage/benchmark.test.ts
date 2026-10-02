import { describe, expect, it } from 'vitest'
import { benchmarkEvents, evaluateCoverage, matchesEvent, type CoverageArticle } from './benchmark'
const article: CoverageArticle = { id: 'one', title: 'Google presenta Gemini 4 Argon', url: 'https://example.com/argon', excerpt: null, published_at: '2026-09-30T12:00:00Z', created_at: '2026-10-02T12:00:00Z' }
describe('frozen coverage sample', () => {
  it('does not treat general Gemini news or older announcements as coverage', () => {
    expect(matchesEvent(benchmarkEvents[0], { ...article, title: 'Google Gemini: tutte le novità' })).toBe(false)
    expect(matchesEvent(benchmarkEvents[0], { ...article, published_at: '2025-09-30' })).toBe(false)
    expect(matchesEvent(benchmarkEvents[0], { ...article, published_at: '2026-10-03' })).toBe(false)
  })
  it('counts events once even with repeated coverage and preserves all misses', () => {
    const report = evaluateCoverage([article, { ...article, id: 'two' }])
    expect(report.covered).toBe(1)
    expect(report.total).toBe(20)
    expect(report.events.filter(e => !e.matches.length)).toHaveLength(19)
    expect(report.sectors).toHaveLength(5)
  })
  it('keeps distinct court documents and accepts a canonical primary URL', () => {
    const event = benchmarkEvents.find(e => e.id === 'cass-34754')!
    expect(matchesEvent(event, { ...article, title: 'Documento', published_at: '2026-09-30', url: event.reference + '&utm_source=test' })).toBe(true)
    expect(matchesEvent(event, { ...article, title: 'Documento', published_at: '2026-09-30', url: event.reference.replace('52359', '52356') })).toBe(false)
  })
})
