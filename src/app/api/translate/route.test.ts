import {beforeEach,expect,it,vi} from 'vitest'
const mocks=vi.hoisted(()=>({owner:vi.fn(),completion:vi.fn(),article:vi.fn(),reader:vi.fn(),rate:vi.fn()}))
vi.mock('@/lib/server/auth',()=>({requireOwner:mocks.owner,enforceRateLimit:mocks.rate,UnauthorizedError:class extends Error{},RateLimitError:class extends Error{}}))
vi.mock('@/lib/server/clients',()=>({getServiceSupabase:()=>({from:(table:string)=>{
 const chain={select:vi.fn(()=>chain),eq:vi.fn(()=>chain),maybeSingle:table==='articles'?mocks.article:mocks.reader};return chain
}})}))
vi.mock('@/lib/ai/completion',()=>({createAICompletion:mocks.completion,AICompletionError:class extends Error{},failureMessage:()=>''}))
import {POST} from './route'
const id='11111111-1111-4111-8111-111111111111'
const request=()=>new Request('https://athena.test/api/translate',{method:'POST',body:JSON.stringify({article_id:id})})
beforeEach(()=>{vi.clearAllMocks();mocks.owner.mockResolvedValue({id:'owner'});mocks.article.mockResolvedValue({data:{id},error:null});mocks.reader.mockResolvedValue({data:{body:'Original English paragraph.',content_status:'partial'},error:null});mocks.completion.mockResolvedValue({response:{choices:[{message:{content:'Paragrafo italiano.'}}]}})})
it('translates only the owner’s server-held text and returns its original and partial status',async()=>{
 const result=await (await POST(request())).json()
 expect(result).toMatchObject({success:true,body:'Paragrafo italiano.',original:'Original English paragraph.',status:'partial'})
 expect(mocks.completion.mock.calls[0][0].messages[1].content).toBe('Original English paragraph.')
})
it('does not call the provider for an article outside the owner scope',async()=>{
 mocks.article.mockResolvedValue({data:null,error:null})
 expect((await POST(request())).status).toBe(404)
 expect(mocks.completion).not.toHaveBeenCalled()
})
it('requires a reader body and refuses client-supplied replacement text',async()=>{
 mocks.reader.mockResolvedValue({data:null,error:null})
 expect((await POST(request())).status).toBe(409)
 const invalid=new Request('https://athena.test/api/translate',{method:'POST',body:JSON.stringify({article_id:id,body:'arbitrary text'})})
 expect((await POST(invalid)).status).toBe(400)
 expect(mocks.completion).not.toHaveBeenCalled()
})
