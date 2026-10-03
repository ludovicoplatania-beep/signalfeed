// @vitest-environment jsdom
import React from 'react'
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {LibraryProvider} from './library'
import {SavedView} from './feed'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('searches saved titles and tags, filters folders and persists organization',async()=>{
 const entry={article_id:'a',read_at:null,folder:'Ricerca',tags:['robotica']}
 vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>new Response(JSON.stringify(options?.method?{success:true,entry:{...entry,...JSON.parse(String(options.body))}}:{success:true,entries:[entry]}))))
 const article={id:'a',title:'Una notizia',url:'https://example.com/a',excerpt:null,image_url:null,article_content:null,published_at:null,sources:{name:'Fonte'}}
 render(<LibraryProvider><SavedView savedArticles={[{id:'saved',article_id:'a',created_at:'',articles:article}]} toggleSave={async()=>{}} openReader={()=>{}}/></LibraryProvider>)
 await screen.findByText('#robotica')
 fireEvent.change(screen.getByLabelText('Cerca nei salvati'),{target:{value:'inesistente'}})
 expect(screen.queryByRole('heading',{name:'Una notizia'})).toBeNull()
 fireEvent.change(screen.getByLabelText('Cerca nei salvati'),{target:{value:'robotica'}})
 expect(screen.getByRole('heading',{name:'Una notizia'})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Organizza'}))
 fireEvent.change(screen.getByLabelText('Cartella articolo'),{target:{value:'IA'}})
 fireEvent.change(screen.getByLabelText('Tag articolo'),{target:{value:'robotica, modelli'}})
 fireEvent.click(screen.getByRole('button',{name:'Salva organizzazione'}))
 await waitFor(()=>expect(screen.getByText('Cartella: IA')).toBeTruthy())
 expect(fetch).toHaveBeenCalledWith('/api/library',expect.objectContaining({method:'PATCH',body:JSON.stringify({article_id:'a',folder:'IA',tags:['robotica','modelli']})}))
})
