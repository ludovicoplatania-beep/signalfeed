import { afterEach,beforeEach,expect,it,vi } from 'vitest'
const mock=vi.hoisted(()=>({send:vi.fn(),subscription:vi.fn(),update:vi.fn(),eq:vi.fn()}))
vi.mock('web-push',()=>({default:{sendNotification:mock.send}}))
vi.mock('@/lib/server/auth',()=>({requireOwner:async()=>({id:'owner'}),enforceRateLimit:vi.fn()}))
vi.mock('@/lib/alerts/server',()=>({pushReady:()=>true}))
vi.mock('@/lib/server/clients',()=>({getServiceSupabase:()=>({from:()=>{const chain={select:()=>chain,eq:(...args:unknown[])=>{mock.eq(...args);return chain},maybeSingle:mock.subscription,update:(value:unknown)=>{mock.update(value);return chain},then:(resolve:(value:unknown)=>void)=>Promise.resolve({error:null}).then(resolve)};return chain}})}))
import { POST } from './route'
const endpoint='https://fcm.googleapis.com/fcm/send/device-private'
const request=()=>new Request('https://athena-os.vercel.app/api/alerts/test',{method:'POST',body:JSON.stringify({endpoint})})
beforeEach(()=>{vi.clearAllMocks();mock.subscription.mockResolvedValue({data:{id:'device',endpoint,p256dh:'private-device-key',auth:'private-auth'},error:null});mock.send.mockResolvedValue({})})
afterEach(()=>vi.unstubAllEnvs())
it('sends a short-lived explicit test only to an owned active subscription',async()=>{
 const response=await POST(request());expect(response.status).toBe(200)
 expect(mock.eq).toHaveBeenCalledWith('user_id','owner');expect(mock.eq).toHaveBeenCalledWith('active',true)
 expect(mock.send).toHaveBeenCalledWith(expect.anything(),JSON.stringify({type:'test',tag:'athena-push-test',url:'/'}),expect.objectContaining({TTL:60,timeout:8000}))
})
it('refuses unregistered devices without contacting the push service',async()=>{
 mock.subscription.mockResolvedValue({data:null,error:null});expect((await POST(request())).status).toBe(404);expect(mock.send).not.toHaveBeenCalled()
})
it('deactivates expired subscriptions and keeps endpoint credentials out of the response',async()=>{
 mock.send.mockRejectedValue({statusCode:410,body:endpoint+' private-auth'});const response=await POST(request());const body=await response.text()
 expect(response.status).toBe(502);expect(body).not.toContain('private-auth');expect(body).not.toContain(endpoint)
 expect(mock.update).toHaveBeenCalledWith({active:false,last_error:'Prova push: HTTP 410'})
})
