// @vitest-environment jsdom
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {expect,it,vi} from 'vitest'
import {waitFor,fireEvent} from '@testing-library/react'
const html=readFileSync('public/offline.html','utf8')
const script=readFileSync('public/offline.js','utf8')
it('opens and searches downloaded original and translation without any network or online session',async()=>{
 document.documentElement.innerHTML=html
 const record={id:'a',article:{title:'<script>unsafe</script>',url:'https://example.com/a',sources:{name:'Fonte'}},body:'Original paragraph 123',status:'partial',downloadedAt:'2026-10-04T06:00:00Z',translation:{body:'Traduzione italiana 123',original:'Original paragraph 123',translatedAt:'2026-10-04T06:00:00Z'}}
 let records=[record]
 const indexedDB={open:()=>{
  const request:{result?:unknown;onsuccess?:()=>void}={}
  const db={close:()=>{},transaction:()=>{
   const tx:{oncomplete?:()=>void;objectStore?:()=>unknown}={}
   tx.objectStore=()=>({getAll:()=>{const result={result:records};setTimeout(()=>tx.oncomplete?.(),0);return result},delete:()=>{records=[];const result={result:undefined};setTimeout(()=>tx.oncomplete?.(),0);return result},clear:()=>{records=[];const result={result:undefined};setTimeout(()=>tx.oncomplete?.(),0);return result}})
   return tx
  }}
  request.result=db;setTimeout(()=>request.onsuccess?.(),0);return request
 }}
 const network=vi.fn(()=>{throw new Error('offline')})
 vm.runInNewContext(script,{document,window:{addEventListener:()=>{},scrollTo:()=>{}},navigator:{onLine:false},indexedDB,URL,Promise,setTimeout,fetch:network})
 await waitFor(()=>expect(document.querySelector('#list h2')?.textContent).toBe('<script>unsafe</script>'))
 expect(document.querySelector('#list script')).toBeNull()
 fireEvent.click(document.querySelector('#list button')!)
 await waitFor(()=>expect(document.querySelector('#body')?.textContent).toBe('Original paragraph 123'))
 expect(document.querySelector('#status')?.textContent).toContain('parziale')
 fireEvent.click(document.querySelector('#translated')!)
 expect(document.querySelector('#body')?.textContent).toBe('Traduzione italiana 123')
 fireEvent.click(document.querySelector('#original')!)
 expect(document.querySelector('#body')?.textContent).toBe('Original paragraph 123')
 expect(network).not.toHaveBeenCalled()
})
