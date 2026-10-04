// @vitest-environment jsdom
import React from 'react'
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {EventsView} from './events'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('filters multilingual coverage, preserves source attribution and shows exact chronology dates',async()=>{
 const article=(id:string,title:string,date:string)=>({id,title,url:`https://example.com/${id}`,excerpt:'Copertura',article_content:null,image_url:null,published_at:date,sources:{name:'Editore'}})
 const data={success:true,event:{id:'event',title:'Annuncio condiviso',synopsis:'Fatto specifico',created_at:'2026-10-04T00:00:00Z',updated_at:'2026-10-04T01:00:00Z'},coverage:[{article_id:'it',language:'it',focus:'Copertura italiana',added_at:'2026-10-04T02:00:00Z',articles:article('it','Titolo italiano','2026-10-04T00:30:00Z')},{article_id:'en',language:'en',focus:'Copertura inglese',added_at:'2026-10-04T03:00:00Z',articles:article('en','English title','2026-10-04T01:30:00Z')}],primary:[{url:'https://openai.com/index/announcement',label:'Annuncio originale',article_id:'en',checked_at:'2026-10-04T04:00:00Z'}]}
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(data))))
 render(<EventsView id="event" savedIds={new Set()} toggleSave={async()=>{}} openReader={()=>{}}/>)
 await screen.findByRole('heading',{name:'Annuncio condiviso'})
 expect(screen.getByRole('link',{name:'Annuncio originale'}).getAttribute('href')).toBe('https://openai.com/index/announcement')
 expect(screen.getAllByText(/pubblicato.*aggiunto alla raccolta/)).toHaveLength(2)
 fireEvent.change(screen.getByLabelText('Lingua della copertura'),{target:{value:'en'}})
 await waitFor(()=>expect(screen.queryByRole('heading',{name:'Titolo italiano'})).toBeNull())
 expect(screen.getByRole('heading',{name:'English title'})).toBeTruthy()
})
