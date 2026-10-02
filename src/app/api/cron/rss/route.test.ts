import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ enqueue: vi.fn(), status: vi.fn() }))
vi.mock('@/lib/server/env', () => ({ getServerEnv: () => ({ OWNER_USER_ID: 'owner', CRON_SECRET: 'private-test-cron' }) }))
vi.mock('@/lib/server/updateResponse', () => ({ enqueueUpdate: mocks.enqueue }))
vi.mock('@/lib/server/pipeline', () => ({ getUpdate: mocks.status }))
import { GET } from './route'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.enqueue.mockResolvedValue(new Response('{}', { status: 202 }))
  mocks.status.mockResolvedValue({ id: 'job', status: 'completed' })
})
function request(query = '', authorized = true) {
  return new Request(`https://athena.test/api/cron/rss${query}`, {
    headers: authorized ? { Authorization: 'Bearer private-test-cron' } : {},
  })
}
describe('private scheduled news import', () => {
  it('rejects unauthenticated starts and status reads before accessing data', async () => {
    for (const query of ['', '?status=1']) expect((await GET(request(query, false))).status).toBe(401)
    expect(mocks.enqueue).not.toHaveBeenCalled()
    expect(mocks.status).not.toHaveBeenCalled()
  })
  it('starts only RSS work for due sources', async () => {
    expect((await GET(request())).status).toBe(202)
    expect(mocks.enqueue).toHaveBeenCalledWith('owner', 'rss', { dueSourcesOnly: true })
  })
  it('reads progress without starting another import', async () => {
    const response = await GET(request('?status=1'))
    expect(await response.json()).toMatchObject({ job: { status: 'completed' } })
    expect(response.headers.get('Cache-Control')).toContain('no-store')
    expect(mocks.enqueue).not.toHaveBeenCalled()
  })
})
