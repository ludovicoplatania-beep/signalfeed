import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ discover: vi.fn(), rpc: vi.fn() }))
vi.mock('@/lib/server/auth', async original => ({ ...await original<typeof import('@/lib/server/auth')>(), requireOwner: async () => ({ id: 'owner' }), enforceRateLimit: vi.fn() }))
vi.mock('@/lib/server/clients', () => ({ getServiceSupabase: () => ({ from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }), rpc: mocks.rpc }) }))
vi.mock('@/lib/rss/discovery', () => ({ discoverFeed: mocks.discover }))
vi.mock('@/lib/sources/catalog', () => ({ sourceCatalog: ['valid', 'stale', 'html', 'blocked'].map(name => ({ name, site: `https://${name}.test`, feed: `https://${name}.test/feed` })) }))
import { POST } from './route'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.rpc.mockResolvedValue({ data: 'source', error: null })
  mocks.discover.mockImplementation(async (source: { name: string }) => {
    if (source.name === 'blocked') throw new Error('Fonte rifiuta le richieste')
    return { mode: source.name === 'html' ? 'html' : 'rss', url: `https://${source.name}.test/feed`, items: [{ title: 'Notizia verificabile', link: `https://${source.name}.test/article`, isoDate: source.name === 'stale' ? '2025-01-01T00:00:00Z' : new Date().toISOString() }] }
  })
})
describe('verified source expansion', () => {
  it('adds only recent importable feeds and reports failures without inserting them', async () => {
    const response = await POST(new Request('https://athena.test/api/sources/expand', { method: 'POST' }))
    const data = await response.json()
    expect(data.added).toBe(1)
    expect(data.reports.filter((report: { status: string }) => report.status === 'unavailable')).toHaveLength(3)
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({ p_user: 'owner', p_name: 'valid', p_feed: 'https://valid.test/feed' })
  })
})
