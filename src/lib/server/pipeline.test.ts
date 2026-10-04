import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  repair: vi.fn(), imports: vi.fn(), profile: vi.fn(), candidates: vi.fn(),
  eventGroups:vi.fn(),eventUpdates:vi.fn(),picks: vi.fn(), topics: vi.fn(), digest: vi.fn(), save: vi.fn(),
}))
vi.mock('@/lib/rss/importSources', () => ({ importSources: mocks.imports, repairArticleIdentities: mocks.repair }))
vi.mock('@/lib/ai/updateInterestProfile', () => ({ updateInterestProfile: mocks.profile }))
vi.mock('@/lib/ai/pickArticles', () => ({ pickArticles: mocks.picks, loadCandidates: mocks.candidates }))
vi.mock('@/lib/ai/generateTopics', () => ({ generateTopics: mocks.topics }))
vi.mock('@/lib/events/sync',()=>({syncEvents:mocks.eventGroups}))
vi.mock('@/lib/events/incremental',()=>({attachEventUpdates:mocks.eventUpdates}))
vi.mock('@/lib/ai/generateDigest', () => ({ generateDigest: mocks.digest }))
vi.mock('./clients', () => ({ getServiceSupabase: () => ({ from: () => {
  const query = { update: mocks.save, eq: () => query, then: (resolve: (value: unknown) => void) => Promise.resolve({ error: null }).then(resolve) }
  mocks.save.mockReturnValue(query)
  return query
} }) }))
import { runUpdate, type UpdateJob, type UpdateMode } from './pipeline'
function job(mode: UpdateMode) {
  return { id: 'job', user_id: 'owner', mode, status: 'running', phase: 'queued', started_at: '', updated_at: '', message: null, result: null } as UpdateJob
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.repair.mockResolvedValue(0)
  mocks.imports.mockResolvedValue([])
  mocks.profile.mockResolvedValue(undefined)
  mocks.candidates.mockResolvedValue([])
  mocks.picks.mockResolvedValue({ count: 10, automaticCount: 0, diagnostics: {} })
  mocks.topics.mockResolvedValue(undefined)
  mocks.digest.mockResolvedValue(undefined)
  mocks.eventGroups.mockResolvedValue({count:0});mocks.eventUpdates.mockResolvedValue({added:0})
})
describe('independent news and AI pipelines', () => {
  it('imports scheduled news without invoking any AI stage', async () => {
    const result = await runUpdate(job('rss'), { dueSourcesOnly: true })
    expect(mocks.imports).toHaveBeenCalledWith('owner', { dueOnly: true })
    for (const action of [mocks.profile, mocks.candidates, mocks.picks, mocks.topics, mocks.digest,mocks.eventGroups]) expect(action).not.toHaveBeenCalled()
    expect(result.stages.sources.success).toBe(true)
  })
  it('refreshes AI including learned interests without importing sources', async () => {
    const result = await runUpdate(job('ai'))
    expect(mocks.imports).not.toHaveBeenCalled()
    for (const action of [mocks.profile, mocks.picks, mocks.topics, mocks.digest,mocks.eventGroups]) expect(action).toHaveBeenCalledOnce()
    expect(result.summary.picksCount).toBe(10)
  })
  it('retains full-update compatibility', async () => {
    await runUpdate(job('all'))
    expect(mocks.imports).toHaveBeenCalledOnce()
    expect(mocks.profile).toHaveBeenCalledOnce()
    expect(mocks.picks).toHaveBeenCalledOnce()
  })
  it('keeps imported news when one source fails and marks the job partial', async () => {
    mocks.imports.mockResolvedValue([{ success: false, newCount: 0, updatedCount: 0, count: 0 }, { success: true, newCount: 1, updatedCount: 0, count: 1 }])
    await runUpdate(job('rss'))
    expect(mocks.save.mock.calls.at(-1)?.[0].status).toBe('partial')
    expect(mocks.picks).not.toHaveBeenCalled()
  })
})

it('marks import failed when every checked source fails', async () => {
  mocks.imports.mockResolvedValue([{ success: false, newCount: 0, updatedCount: 0, count: 0 }])
  await runUpdate(job('rss'))
  expect(mocks.save.mock.calls.at(-1)?.[0].status).toBe('failed')
})

it('attaches matching imported coverages without starting semantic AI grouping',async()=>{
 mocks.imports.mockResolvedValue([{success:true,newCount:2,updatedCount:0,count:2}])
 const result=await runUpdate(job('rss'))
 expect(mocks.eventUpdates).toHaveBeenCalledWith('owner')
 expect(mocks.eventGroups).not.toHaveBeenCalled()
 expect(result.stages.event_updates.success).toBe(true)
})
