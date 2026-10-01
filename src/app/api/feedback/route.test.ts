import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ owner: vi.fn(), rpc: vi.fn() }))
vi.mock('@/lib/server/auth', async original => ({ ...await original<typeof import('@/lib/server/auth')>(), requireOwner: mocks.owner, enforceRateLimit: vi.fn() }))
vi.mock('@/lib/server/clients', () => ({ getServiceSupabase: () => ({ rpc: mocks.rpc }) }))
import { POST } from './route'
import { UnauthorizedError } from '@/lib/server/auth'
const id = '00000000-0000-4000-8000-000000000001'
const request = (body: unknown) => new Request('https://athena.test/api/feedback', { method: 'POST', body: JSON.stringify(body) })
beforeEach(() => { vi.clearAllMocks(); mocks.owner.mockResolvedValue({ id: 'owner' }); mocks.rpc.mockResolvedValue({ data: id, error: null }) })
describe('feedback API ownership', () => {
  it('uses the authenticated owner and permits undo', async () => {
    expect((await POST(request({ article_id: id, preference: null }))).status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith('athena_set_feedback', { p_user: 'owner', p_article: id, p_preference: null })
  })
  it('rejects unsigned requests and client-supplied owner IDs', async () => {
    mocks.owner.mockRejectedValueOnce(new UnauthorizedError('Accesso richiesto'))
    expect((await POST(request({ article_id: id, preference: 'like' }))).status).toBe(401)
    expect((await POST(request({ article_id: id, preference: 'like', user_id: 'other' }))).status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
