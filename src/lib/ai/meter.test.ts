import {beforeEach,expect,it,vi} from 'vitest'
const m=vi.hoisted(()=>({rpc:vi.fn(),update:vi.fn(),eq:vi.fn()}))
vi.mock('@/lib/server/clients',()=>({getServiceSupabase:()=>({rpc:m.rpc,from:()=>({update:m.update})})}))
vi.mock('@/lib/server/env',()=>({getServerEnv:()=>({OWNER_USER_ID:'owner'})}))
import {reserveAttempt,settleAttempt} from './meter'
beforeEach(()=>{vi.clearAllMocks();m.update.mockReturnValue({eq:m.eq});m.eq.mockReturnValue({eq:async()=>({error:null})})})
it('fails closed before provider access when metering or the cap is unavailable',async()=>{
 m.rpc.mockResolvedValue({data:{allowed:false},error:null});await expect(reserveAttempt({model:'gpt-4o-mini',messages:[]},'picks')).rejects.toMatchObject({code:'budget'})
 m.rpc.mockResolvedValue({data:null,error:{message:'DB down'}});await expect(reserveAttempt({model:'gpt-4o-mini',messages:[]},'picks')).rejects.toMatchObject({code:'metering'})
})
it('retains unknown timeout cost and marks rejected requests as free',async()=>{
 await settleAttempt('id',undefined,{name:'APIConnectionTimeoutError'});expect(m.update).toHaveBeenLastCalledWith(expect.objectContaining({status:'uncertain',cost_microusd:null}))
 await settleAttempt('id',undefined,{status:429});expect(m.update).toHaveBeenLastCalledWith(expect.objectContaining({status:'rejected',cost_microusd:0}))
 await settleAttempt('id',{prompt_tokens:1000000,completion_tokens:1000000,prompt_tokens_details:{cached_tokens:500000}});expect(m.update).toHaveBeenLastCalledWith(expect.objectContaining({cost_microusd:712500,status:'measured'}))
})
