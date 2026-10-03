import { beforeEach, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
const mocks = vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('server-only',()=>({}))
vi.mock('./env',()=>({getServerEnv:()=>({CRON_SECRET:'legacy-private-cron-secret-for-tests'})}))
vi.mock('./clients',()=>({getServiceSupabase:()=>({rpc:mocks.rpc})}))
import { requireRssCron } from './rssCronAuth'
import { requireCron } from './auth'
beforeEach(()=>{vi.clearAllMocks();mocks.rpc.mockResolvedValue({data:true,error:null})})
const request=(token:string)=>new Request('https://athena.test/api/cron/rss',{headers:{Authorization:`Bearer ${token}`}})
it('keeps the existing cron secret without a database call',async()=>{
 await requireRssCron(request('legacy-private-cron-secret-for-tests'))
 expect(mocks.rpc).not.toHaveBeenCalled()
})
it('accepts only an explicit database validation and sends a hash, never the token',async()=>{
 const token='a'.repeat(64)
 await requireRssCron(request(token))
 expect(mocks.rpc).toHaveBeenCalledWith('athena_validate_rss_cron',{p_hash:createHash('sha256').update(token).digest('hex')})
 expect(()=>requireCron(request(token))).toThrow()
})
it('fails closed for malformed credentials without querying the database',async()=>{
 for(const token of ['', 'short', 'z'.repeat(64), 'a'.repeat(65)]) await expect(requireRssCron(request(token))).rejects.toThrow()
 expect(mocks.rpc).not.toHaveBeenCalled()
})
it('fails closed when the validator is absent, errors, or returns a non-boolean',async()=>{
 for(const result of [{data:false,error:null},{data:null,error:{code:'PGRST202'}},{data:'true',error:null}]) {
  mocks.rpc.mockResolvedValueOnce(result)
  await expect(requireRssCron(request('b'.repeat(64)))).rejects.toThrow()
 }
})
