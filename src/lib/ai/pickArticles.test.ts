import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ create: vi.fn(), rpc: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/server/clients', () => ({ getOpenAI: () => ({ chat: { completions: { create: mocks.create } } }), getServiceSupabase: () => ({ from: mocks.from, rpc: mocks.rpc }) }))
import { pickArticles } from './pickArticles'
import type { Candidate } from './ranking'
const owner = '00000000-0000-4000-8000-000000000099'
const articles: Candidate[] = Array.from({ length: 10 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, title: `Notizia numero ${i}`, source_id: 'source', source_name: 'Fonte', source_priority: 3, url: `https://example.com/${i}`, excerpt: 'Descrizione', article_content: null, published_at: new Date().toISOString(), created_at: new Date().toISOString() }))
const response = (picks: unknown[]) => ({ choices: [{ message: { content: JSON.stringify({ picks }) } }] })
const valid = (i = 0) => ({ id: articles[i].id, score: 90, summary: 'Sintesi', reason: 'Motivo', category: 'Generale' })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.from.mockImplementation((table: string) => {
    const builder = { select: () => builder, eq: () => builder, not: () => builder, order: () => builder, limit: () => Promise.resolve({ data: [], error: null }), maybeSingle: () => Promise.resolve({ data: table === 'user_interests' ? { interests: [] } : null, error: null }) }
    return builder
  })
  mocks.rpc.mockImplementation((_name, args) => Promise.resolve({ data: args.p_picks.length, error: null }))
})
describe('resilient IA picks', () => {
  it('truncates a long summary without rejecting valid AI output', async () => {
    mocks.create.mockResolvedValue(response([{ ...valid(), summary: 'a'.repeat(221) }]))
    const result = await pickArticles(owner, articles)
    expect(result.count).toBe(10)
    expect(mocks.rpc.mock.calls[0][1].p_picks.find((p: { article_id: string }) => p.article_id === articles[0].id).summary).toHaveLength(220)
  })
  it('keeps valid picks when another entry is invalid', async () => {
    mocks.create.mockResolvedValue(response([valid(), { ...valid(1), score: 'wrong' }]))
    await pickArticles(owner, articles)
    expect(mocks.rpc.mock.calls[0][1].p_picks.filter((p: { selection_method: string }) => p.selection_method === 'ai')).toHaveLength(1)
  })
  it('retains a valid lower-scoring AI selection ahead of fallback items', async () => {
    mocks.create.mockResolvedValue(response([null, { ...valid(), score: 40 }]))
    await pickArticles(owner, articles)
    const picks = mocks.rpc.mock.calls[0][1].p_picks
    expect(picks[0].selection_method).toBe('ai')
    expect(picks[0].article_id).toBe(articles[0].id)
  })
  it('falls back when OpenAI fails', async () => {
    mocks.create.mockRejectedValue(new Error('provider unavailable'))
    const result = await pickArticles(owner, articles)
    expect(result.automaticCount).toBe(10); expect(result.warning).toContain('IA non disponibile')
  })
  it('falls back on empty and unknown IDs', async () => {
    mocks.create.mockResolvedValue(response([{ ...valid(), id: owner }]))
    expect((await pickArticles(owner, articles)).automaticCount).toBe(10)
    mocks.create.mockResolvedValue(response([]))
    expect((await pickArticles(owner, articles)).count).toBe(10)
  })
  it('rejects database replacement failures', async () => {
    mocks.create.mockResolvedValue(response([valid()]))
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('database unavailable') })
    await expect(pickArticles(owner, articles)).rejects.toThrow('database unavailable')
  })
  it('does not replace prior picks when there are no candidates', async () => {
    await expect(pickArticles(owner, [])).rejects.toThrow('Nessun articolo')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
