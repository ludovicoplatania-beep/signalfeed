import {expect,it} from 'vitest'
import {validGroups} from './clustering'
import {extractPrimaryLinks,primaryUrl} from './primary'
it('uses only supplied article refs, removes duplicates and preserves multilingual labels',()=>{
 const group={title:'Annuncio specifico',synopsis:'Sintesi',articles:[{ref:1,language:'it',focus:'Taglio italiano'},{ref:2,language:'en',focus:'English coverage'},{ref:99,language:'it',focus:'Inventato'},{ref:2,language:'en',focus:'Duplicato'}]}
 expect(validGroups({events:[group,group]},['a','b'])).toEqual([{title:group.title,synopsis:'Sintesi',articles:[{article_id:'a',language:'it',focus:'Taglio italiano'},{article_id:'b',language:'en',focus:'English coverage'}]}])
})
it('never invents official URLs or labels unofficial publishers as primary',()=>{
 expect(primaryUrl('https://openai.com.evil.example/release')).toBeNull()
 expect(primaryUrl('javascript:alert(1)')).toBeNull()
 expect(primaryUrl('https://openai.com/')).toBeNull()
 expect(primaryUrl('https://openai.com/newsroom/')).toBeNull()
 const links=extractPrimaryLinks('<nav><a href="https://openai.com/nav-story">Nav</a></nav><article><a href="https://openai.com/index/announcement">Annuncio ufficiale</a><a href="https://example.com/story">Giornale</a><a href="https://openai.com/policies/privacy">Privacy</a></article>','https://example.com/story')
 expect(links).toEqual([{url:'https://openai.com/index/announcement',label:'Annuncio ufficiale'}])
})

import {eventPool} from './pool'
import type {Candidate} from '@/lib/ai/ranking'
it('reserves room for international publishers and keeps competing same-event coverage',()=>{
 const article=(id:string,host:string,title:string,date:string):Candidate=>({id,title,url:`https://${host}/${id}`,source_id:host,source_name:host,source_priority:3,published_at:date,created_at:date,excerpt:null,article_content:null})
 const local=Array.from({length:100},(_,i)=>article(`local${i}`,'locale.example','Evento locale', '2026-10-04T06:00:00Z'))
 const foreign=article('foreign','international.example','English coverage','2026-10-03T06:00:00Z')
 const coverage=article('coverage','second.example','Evento locale','2026-10-04T06:00:00Z')
 const pool=eventPool([...local,foreign,coverage],6)
 expect(pool).toContain(foreign);expect(pool).toContain(coverage)
 expect(pool.filter(entry=>entry.title==='Evento locale').length).toBeGreaterThan(1)
})
