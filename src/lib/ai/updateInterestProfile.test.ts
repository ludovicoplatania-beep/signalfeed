import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ events: [] as { created_at: string }[], existing: null as null | { updated_at: string }, upsert: vi.fn(), create: vi.fn() }))
vi.mock('@/lib/server/clients', () => ({ getOpenAI: () => ({ chat: { completions: { create: mocks.create } } }), getServiceSupabase: () => ({ from: () => {
  const query = { select: () => query, eq: () => query, order: () => query, limit: () => Promise.resolve({ data: mocks.events, error: null }), maybeSingle: () => Promise.resolve({ data: mocks.existing, error: null }), upsert: mocks.upsert }; return query
} }) }))
import { updateInterestProfile } from './updateInterestProfile'
beforeEach(() => { vi.clearAllMocks(); mocks.events = []; mocks.existing = null; mocks.upsert.mockResolvedValue({ error: null }); mocks.create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ interests: [{ topic: 'Tecnologia', score: 80 }] }) } }] }) })
describe('interest profile persistence', () => {
  it('skips users with no events', async () => {
    expect(await updateInterestProfile('owner')).toEqual({ skipped: true }); expect(mocks.create).not.toHaveBeenCalled()
  })
  it('updates the owner record rather than conflicting on user_id', async () => {
    mocks.events = [{ created_at: '2026-09-26T09:00:00Z' }]; mocks.existing = { updated_at: '2026-05-01T09:00:00Z' }
    await updateInterestProfile('owner')
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'owner' }), { onConflict: 'user_id' })
  })
  it('does not charge for reprocessing unchanged events', async () => {
    mocks.events = [{ created_at: '2026-09-26T09:00:00Z' }]; mocks.existing = { updated_at: '2026-10-01T09:00:00Z' }
    expect(await updateInterestProfile('owner')).toEqual({ skipped: true }); expect(mocks.create).not.toHaveBeenCalled()
  })
})
