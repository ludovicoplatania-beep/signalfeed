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
