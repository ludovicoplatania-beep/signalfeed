vi.mock('./meter',()=>({MeterError:class extends Error{},reserveAttempt:vi.fn(async()=>'attempt'),settleAttempt:vi.fn(async()=>{})}))
import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ events: [] as { created_at: string }[], feedback: [] as { preference: string | null; updated_at: string }[], existing: null as null | { updated_at: string; interests?: {topic:string;score:number;origin?:string;learned_at?:string}[] }, upsert: vi.fn(), create: vi.fn() }))
vi.mock('@/lib/server/clients', () => ({ getOpenAI: () => ({ chat: { completions: { create: mocks.create } } }), getServiceSupabase: () => ({ from: (table: string) => {
  const query = { select: () => query, eq: () => query, order: () => query, limit: () => Promise.resolve({ data: table === 'article_feedback' ? mocks.feedback : mocks.events, error: null }), maybeSingle: () => Promise.resolve({ data: mocks.existing, error: null }), upsert: mocks.upsert }; return query
} }) }))
const saveProfile = vi.hoisted(()=>vi.fn().mockResolvedValue({}))
vi.mock('@/lib/server/editorial',()=>({writeEditorial:saveProfile}))
import { updateInterestProfile } from './updateInterestProfile'
beforeEach(() => { vi.clearAllMocks(); mocks.events = []; mocks.feedback = []; mocks.existing = null; mocks.upsert.mockResolvedValue({ error: null }); mocks.create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ interests: [{ topic: 'Tecnologia', score: 80 }] }) } }] }) })
describe('interest profile persistence', () => {
  it('skips users with no events', async () => {
    expect(await updateInterestProfile('owner')).toEqual({ skipped: true }); expect(mocks.create).not.toHaveBeenCalled()
  })
  it('updates the owner record rather than conflicting on user_id', async () => {
    mocks.events = [{ created_at: '2026-09-26T09:00:00Z' }]; mocks.existing = { updated_at: '2026-05-01T09:00:00Z' }
    await updateInterestProfile('owner')
    expect(saveProfile).toHaveBeenCalledWith('owner', [{topic:'Tecnologia',score:80}], null, 'learned')
  })
  it('does not charge for reprocessing unchanged events', async () => {
    mocks.events = [{ created_at: '2026-09-26T09:00:00Z' }]; mocks.existing = { updated_at: '2026-10-01T09:00:00Z' }
    expect(await updateInterestProfile('owner')).toEqual({ skipped: true }); expect(mocks.create).not.toHaveBeenCalled()
  })
})

  it('rebuilds a cached profile when explicit feedback is changed or undone', async () => {
    mocks.existing = { updated_at: '2026-09-30T09:00:00Z' }
    mocks.feedback = [{ preference: null, updated_at: '2026-10-01T09:00:00Z' }]
    expect(await updateInterestProfile('owner')).toEqual({ skipped: false })
    expect(mocks.create.mock.calls[0][0].messages[1].content).toContain('Preferenze esplicite:\n[]')
  })

 it('does not treat a manual edit as proof that older learned signals were processed', async()=>{
   mocks.events=[{created_at:'2026-10-01T09:00:00Z'}]
   mocks.existing={updated_at:'2026-10-02T09:00:00Z',interests:[{topic:'gaming',score:70,origin:'manual'},{topic:'Tecnologia',score:80,learned_at:'2026-09-30T09:00:00Z'}]}
   expect(await updateInterestProfile('owner')).toEqual({skipped:false})
 })
