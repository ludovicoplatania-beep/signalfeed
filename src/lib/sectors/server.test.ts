import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(()=>({create:vi.fn(),rpc:vi.fn(),saved:[] as Record<string,unknown>[] }))
const sources = Array.from({length:6},(_,i)=>({id:`source${i}`,name:`Publisher ${i}`,priority:3,website_url:`https://publisher${i}.test`}))
const articles = sources.flatMap((source,s)=>Array.from({length:5},(_,i)=>({id:`00000000-0000-4000-8000-${String(s*5+i+1).padStart(12,'0')}`,title:`Videogioco numero ${s*5+i}: nuova modalità`,url:`${source.website_url}/${i}`,excerpt:null,article_content:null,image_url:null,published_at:new Date().toISOString(),created_at:new Date().toISOString(),source_id:source.id,source_priority:3,sources:{name:source.name}})))
vi.mock('@/lib/ai/completion',()=>({createAICompletion:mocks.create, AICompletionError:class extends Error {},failureMessage:()=> 'timeout'}))
vi.mock('@/lib/server/clients',()=>({getServiceSupabase:()=>({rpc:mocks.rpc,from:(table:string)=>{
  const builder={select:()=>builder,eq:()=>builder,lt:()=>builder,not:()=>builder,order:()=>builder,limit:()=>builder,in:()=>builder,is:()=>builder,
    insert:()=>Promise.resolve({error:null}),update:(value:Record<string,unknown>)=>{mocks.saved.push(value);return builder},
    maybeSingle:()=>Promise.resolve({error:null,data:table==='user_interests'?{interests:[]}:table==='sector_curations'?{id:'curation',created_at:new Date().toISOString(),...mocks.saved.findLast(row=>Array.isArray(row.picks))}:null}),
    then:(resolve:(v:unknown)=>void)=>Promise.resolve({error:null,data:table==='sources'?sources:table==='articles'?articles:[]}).then(resolve)}
  return builder
}})}))
import { curateSector } from './server'
import { getSector } from './catalog'
beforeEach(()=>{
  vi.clearAllMocks();mocks.saved.length=0
  mocks.rpc.mockImplementation((_name,args)=>Promise.resolve({error:null,data:{articles:articles.filter(a=>a.source_id===args.p_source),total:5}}))
})
describe('persisted thematic selection',()=>{
  it('saves only ten diversified choices and diagnostics when the provider fails',async()=>{
    mocks.create.mockRejectedValue(new Error('provider unavailable'))
    const result=await curateSector('owner',getSector('videogiochi')!)
    expect(result?.status).toBe('automatic')
    expect(result?.picks).toHaveLength(10)
    expect(result?.diversity?.selectedPublishers).toBeGreaterThanOrEqual(5)
    expect(mocks.rpc).toHaveBeenCalledTimes(6)
    expect(mocks.rpc.mock.calls.every(([,args])=>args.p_source && args.p_since)).toBe(true)
  })
  it('validates existing references and persists a bounded mixed selection when the model succeeds',async()=>{
    mocks.create.mockResolvedValue({response:{choices:[{message:{content:JSON.stringify({picks:Array.from({length:10},(_,i)=>({ref:i+1,score:95,reason:'Notizia del settore',category:'Videogiochi'}))})}}],usage:{}},attempts:1,elapsedMs:50})
    const result=await curateSector('owner',getSector('videogiochi')!)
    expect(result?.status).toBe('completed')
    expect(result?.picks).toHaveLength(10)
    expect(result?.diversity?.selectedPublishers).toBeGreaterThanOrEqual(5)
    expect(result?.picks.some(p=>p.selection_method==='ai')).toBe(true)
  })
})
