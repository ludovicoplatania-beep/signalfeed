import { expect,it } from 'vitest'
import { extractReader,fallbackReader } from './reader'
const text='Un testo editoriale significativo, con dettagli e informazioni utili. '.repeat(12)
it('accepts structured full text only with an explicit free-access signal',()=>{
 const html=(free?:boolean)=>`<script type="application/ld+json">${JSON.stringify({'@type':'NewsArticle',articleBody:text,...(free===undefined?{}:{isAccessibleForFree:free})})}</script>`
 expect(extractReader(html(true))).toEqual({body:text.trim(),status:'full'})
 expect(extractReader(html())).toMatchObject({status:'unverified'})
 expect(extractReader(html(false))).toMatchObject({status:'partial'})
})
it('preserves paragraphs, excludes navigation and never calls an RSS snippet full',()=>{
 const extracted=extractReader(`<nav><p>Menu da escludere</p></nav><article><p>${text}</p><p>Secondo paragrafo.</p></article>`)
 expect(extracted?.body).toContain('\n\nSecondo paragrafo.')
 expect(extracted?.body).not.toContain('Menu da escludere')
 expect(extracted?.status).toBe('unverified')
 expect(fallbackReader(text,text)).toEqual({body:text.trim(),status:'partial'})
 expect(extractReader('<main><p>Accedi</p></main>')).toBeNull()
})
it('labels subscription and truncated text partial',()=>{
 expect(extractReader(`<article><p>${text} Subscribe to continue</p></article>`)).toMatchObject({status:'partial'})
 expect(extractReader(`<article><p>${'a'.repeat(100100)}</p></article>`)).toMatchObject({status:'partial',body:'a'.repeat(100000)})
})

it('ignores structured text from a different article on the page',()=>{
 expect(extractReader(`<script type="application/ld+json">${JSON.stringify({'@type':'NewsArticle',url:'https://example.com/other',articleBody:text,isAccessibleForFree:true})}</script>`, 'https://example.com/requested')).toBeNull()
})

it('prefers editorial content over longer page recommendations',()=>{
 const extracted=extractReader(`<main><article><div class="entry-content"><p>${text}</p></div><div class="related"><p>${'Suggerimento '.repeat(1000)}</p></div></article><p>${'Navigazione '.repeat(1000)}</p></main>`)
 expect(extracted?.body).toBe(text.trim())
})
