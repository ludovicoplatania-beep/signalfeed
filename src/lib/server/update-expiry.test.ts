import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ single: vi.fn(), eq: vi.fn(), update: vi.fn() }))
vi.mock('./clients', () => ({ getServiceSupabase: () => ({ from: () => {
 const query = { select: () => query, eq: (key: string, value: unknown) => { mocks.eq(key,value); return query }, update: (value: unknown) => { mocks.update(value); return query }, maybeSingle: mocks.single }
 return query
} }) }))
import { getUpdate } from './pipeline'
beforeEach(() => vi.clearAllMocks())
it('only expires the heartbeat that was read, preserving a concurrent live update', async () => {
 const old = { id:'job',status:'running',updated_at: new Date(Date.now()-400_000).toISOString() }
 mocks.single.mockResolvedValueOnce({data:old,error:null}).mockResolvedValueOnce({data:null,error:null})
 const result = await getUpdate('owner')
 expect(mocks.eq).toHaveBeenCalledWith('updated_at',old.updated_at)
 expect(result?.status).toBe('running')
})
it('persists a failed status for an abandoned job', async () => {
 const old = { id:'job',status:'running',updated_at: new Date(Date.now()-400_000).toISOString() }
 mocks.single.mockResolvedValueOnce({data:old,error:null}).mockResolvedValueOnce({data:{...old,status:'failed'},error:null})
 expect((await getUpdate('owner'))?.status).toBe('failed')
 expect(mocks.update.mock.calls[0][0].message).toContain('interrotto')
})
