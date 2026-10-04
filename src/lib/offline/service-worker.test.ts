import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {expect,it,vi} from 'vitest'
const source=readFileSync('public/sw.js','utf8')
it('serves the standalone library when navigation fails, and never caches API or private dashboard responses',async()=>{
 const handlers:Record<string,(event:unknown)=>void>={}
 const fallback=new Response('offline library')
 const match=vi.fn(async()=>fallback)
 const network=vi.fn(async()=>{throw new Error('network disconnected')})
 const context={URL,Response,fetch:network,caches:{match,open:vi.fn()},self:{location:{origin:'https://athena.test'},addEventListener:(name:string,fn:(event:unknown)=>void)=>{handlers[name]=fn}}}
 vm.runInNewContext(source,context)
 const respondWith=vi.fn()
 handlers.fetch({request:{method:'GET',url:'https://athena.test/',mode:'navigate'},respondWith})
 expect(await respondWith.mock.calls[0][0]).toBe(fallback)
 expect(match).toHaveBeenCalledWith('/offline.html')
 respondWith.mockClear()
 handlers.fetch({request:{method:'GET',url:'https://athena.test/api/data',mode:'cors'},respondWith})
 handlers.fetch({request:{method:'POST',url:'https://athena.test/api/translate',mode:'cors'},respondWith})
 expect(respondWith).not.toHaveBeenCalled()
})
it('keeps network-first navigation responses out of the offline cache',async()=>{
 const handlers:Record<string,(event:unknown)=>void>={}
 const response=new Response('private dashboard')
 const open=vi.fn()
 vm.runInNewContext(source,{URL,Response,fetch:async()=>response,caches:{open},self:{location:{origin:'https://athena.test'},addEventListener:(name:string,fn:(event:unknown)=>void)=>{handlers[name]=fn}}})
 const respondWith=vi.fn()
 handlers.fetch({request:{method:'GET',url:'https://athena.test/',mode:'navigate'},respondWith})
 expect(await respondWith.mock.calls[0][0]).toBe(response)
 expect(open).not.toHaveBeenCalled()
})
