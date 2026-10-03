// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MobileNav } from './mobile-nav'
import { ReaderMode } from './reader-mode'
import Dashboard from './dashboard'
vi.mock('next/navigation', () => ({useRouter:()=>({push:vi.fn(),replace:vi.fn()})}))
const article = {id:'story',title:'Notizia di prova',url:'https://example.com/story',excerpt:null,image_url:null,article_content:'Testo',published_at:null,sources:{name:'Fonte'}}
beforeEach(() => {
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.open=true}})
 Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.open=false}})
 vi.spyOn(window,'scrollTo').mockImplementation(()=>{})
})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})
it('opens all sectors directly from the navigation and closes after choosing one',()=>{
 const change=vi.fn()
 render(<MobileNav activeSection="today" setActiveSection={change}/> )
 fireEvent.click(screen.getByRole('button',{name:'Settori'}))
 const modal=screen.getByRole('dialog',{name:'Scegli un settore'})
 expect(within(modal).getAllByRole('link')).toHaveLength(9)
 const gaming=within(modal).getByRole('link',{name:'Videogiochi'})
 expect(gaming.getAttribute('href')).toBe('/settori/videogiochi')
 fireEvent.click(gaming)
 expect((modal as HTMLDialogElement).open).toBe(false)
 expect(change).not.toHaveBeenCalled()
})
it('reader is modal, supports cancellation and restores position and focus on close',()=>{
 const origin=document.createElement('button');document.body.append(origin);origin.focus()
 vi.spyOn(window,'scrollY','get').mockReturnValue(640)
 const close=vi.fn()
 const view=render(<ReaderMode article={article} saved={false} toggleSave={async()=>{}} close={close}/> )
 const modal=screen.getByRole('dialog',{name:article.title})
 expect((modal as HTMLDialogElement).open).toBe(true)
 expect(document.body.style.overflow).toBe('hidden')
 fireEvent(modal,new Event('cancel',{cancelable:true}))
 expect(close).toHaveBeenCalledOnce()
 view.unmount()
 expect(window.scrollTo).toHaveBeenCalledWith({top:640,behavior:'instant'})
 expect(document.activeElement).toBe(origin)
 expect(document.body.style.overflow).toBe('')
 origin.remove()
})
it('returning to the archive keeps loaded pages and restores the previous position',async()=>{
 const data={success:true,entries:[],sources:[],articles:[],aiPicks:[],savedArticles:[],trendingTopics:[],digests:[],update:null}
 const fetchMock=vi.fn(async(input:string)=>new Response(JSON.stringify(input.startsWith('/api/articles')?{articles:[{...article,id:input.includes('offset=1')?'second':'first',title:input.includes('offset=1')?'Seconda notizia':'Prima notizia',url:input.includes('offset=1')?'https://example.com/second':'https://example.com/first'}],total:2,nextOffset:input.includes('offset=1')?2:1}:data),{status:200}))
 vi.stubGlobal('fetch',fetchMock)
 let y=0;vi.spyOn(window,'scrollY','get').mockImplementation(()=>y)
 render(<Dashboard initialSection="feed"/> )
 await screen.findByText('Prima notizia')
 fireEvent.click(screen.getByRole('button',{name:'Carica altri risultati'}))
 await screen.findByText('Seconda notizia')
 y=800
 const nav=screen.getByRole('navigation',{name:'Navigazione principale'})
 fireEvent.click(within(nav).getByRole('button',{name:'Salvati'}))
 await screen.findByRole('heading',{name:'Articoli salvati'})
 y=0
 fireEvent.click(within(nav).getByRole('button',{name:'Feed'}))
 await screen.findByText('Seconda notizia')
 await waitFor(()=>expect(window.scrollTo).toHaveBeenCalledWith({top:800,behavior:'instant'}))
 expect(fetchMock.mock.calls.filter(([input])=>input.startsWith('/api/articles'))).toHaveLength(2)
})
