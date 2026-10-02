import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ discover: vi.fn(), rpc: vi.fn(), health: vi.fn(), checkedAt: null as string | null, existing: [] as { canonical_url: string }[] }))
vi.mock('./discovery', () => ({ discoverFeed: mocks.discover, cleanHtml: (s: string) => s }))
vi.mock('@/lib/server/clients', () => ({ getServiceSupabase: () => ({ rpc: mocks.rpc, from: () => {
  const query = { select: () => query, in: () => Promise.resolve({ data: mocks.existing, error: null }), eq: () => query, order: () => query, update: mocks.health,
    then: (resolve: (value: unknown) => void) => Promise.resolve({ data: [{ id: 'source', name: 'Fonte', rss_url: 'https://example.com/rss', is_active: true, priority: 4, last_checked_at: mocks.checkedAt }], error: null }).then(resolve) }
  return query
} }) }))
import { importSources } from './importSources'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.checkedAt = null
  mocks.existing = []
  mocks.health.mockReturnValue({ eq: () => Promise.resolve({ error: null }) })
  mocks.rpc.mockResolvedValue({ data: { newCount: 1, updatedCount: 0, unchangedCount: 0 }, error: null })
  mocks.discover.mockResolvedValue({ url: 'https://example.com/rss', mode: 'rss', items: [{ title: 'Notizia', link: 'https://example.com/a', content: 'Contenuto' }] })
})
describe('source ingestion', () => {
  it('uses canonical identity and reports atomic counters', async () => {
    const result = await importSources('owner')
    expect(result[0].newCount).toBe(1)
    expect(mocks.rpc.mock.calls[0][0]).toBe('athena_ingest_articles')
  })
  it('deduplicates tracking variants before ingestion', async () => {
    mocks.discover.mockResolvedValue({ url: 'https://example.com/rss', mode: 'rss', items: [{ title: 'A', link: '/a' }, { title: 'B', link: '/a?utm_source=x' }] })
    await importSources('owner')
    expect(mocks.rpc.mock.calls[0][1].p_articles).toHaveLength(1)
  })
  it('retains valid entries despite malformed links and dates', async () => {
    mocks.discover.mockResolvedValue({ url: 'https://example.com/rss', mode: 'rss', items: [{ title: 'Invalid', link: 'javascript:alert(1)' }, { title: 'Valid', link: '/a', pubDate: 'invalid' }] })
    await importSources('owner')
    expect(mocks.rpc.mock.calls[0][1].p_articles[0].published_at).toBeNull()
    expect(mocks.rpc.mock.calls[0][1].p_articles).toHaveLength(1)
  })
  it('excludes event schedules while retaining editorial articles', async () => {
    mocks.discover.mockResolvedValue({ url: 'https://www.internazionale.it/rss', mode: 'rss', items: [
      { title: 'Evento futuro', link: 'https://www.internazionale.it/festival_fuoriclasse/2026/10/04/evento' },
      { title: 'Notizia', link: 'https://www.internazionale.it/notizie/2026/10/01/editoriale' },
    ] })
    await importSources('owner')
    expect(mocks.rpc.mock.calls[0][1].p_articles).toHaveLength(1)
    expect(mocks.rpc.mock.calls[0][1].p_articles[0].title).toBe('Notizia')
  })
  it('skips fresh sources on scheduled runs and forces them on a manual refresh', async () => {
    mocks.checkedAt = new Date().toISOString()
    expect(await importSources('owner', { dueOnly: true })).toEqual([])
    expect(mocks.discover).not.toHaveBeenCalled()
    expect(await importSources('owner')).toHaveLength(1)
    expect(mocks.discover).toHaveBeenCalledTimes(1)
  })
  it('excludes already imported articles from first-arrival measurements', async () => {
    mocks.existing = [{ canonical_url: 'https://example.com/a' }]
    mocks.rpc.mockResolvedValue({ data: { newCount: 0, updatedCount: 0, unchangedCount: 1 }, error: null })
    const results = await importSources('owner')
    expect(results[0].durationMs).toBeGreaterThanOrEqual(0)
    expect(results[0].ingestionLagSamplesMs).toEqual([])
  })
  it('persists publisher failures instead of reporting success', async () => {
    mocks.discover.mockRejectedValue(new Error('HTTP 403'))
    const result = await importSources('owner')
    expect(result[0].success).toBe(false)
    expect(mocks.health.mock.calls[0][0].last_error).toBe('HTTP 403')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
