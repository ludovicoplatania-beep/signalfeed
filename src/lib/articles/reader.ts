import { load } from 'cheerio'
import { canonicalArticleUrl } from './identity'
import type { ContentStatus } from './readerStatus'
export { fallbackReader } from './readerStatus'
export function extractReader(html:string, expectedUrl?:string){
 const $=load(html); let body=''; let free=false; let restricted=false
 function visit(value:unknown,depth=0){
  if(depth>10||!value||typeof value!=='object')return
  if(Array.isArray(value)){value.forEach(v=>visit(v,depth+1));return}
  const v=value as Record<string,unknown>; const types=Array.isArray(v['@type'])?v['@type']:[v['@type']]
  if(types.some(t=>['Article','NewsArticle','BlogPosting','TechArticle'].includes(String(t)))){
   const url=typeof v.url==='string'?v.url:typeof v.mainEntityOfPage==='string'?v.mainEntityOfPage:null
   let matches=true
   if(url&&expectedUrl){try{matches=canonicalArticleUrl(new URL(url,expectedUrl).toString())===canonicalArticleUrl(expectedUrl)}catch{matches=false}}
   if(matches&&typeof v.articleBody==='string'&&v.articleBody.length>body.length){
    body=v.articleBody; restricted=v.isAccessibleForFree===false||v.isAccessibleForFree==='False';free=v.isAccessibleForFree===true||v.isAccessibleForFree==='True'
   } else if(matches&&!body&&(v.isAccessibleForFree===false||v.isAccessibleForFree==='False'))restricted=true
  }
  Object.values(v).forEach(x=>visit(x,depth+1))
 }
 $('script[type="application/ld+json"]').each((_,el)=>{try{visit(JSON.parse($(el).text()))}catch{/* malformed publisher metadata */}})
 const structured=Boolean(body)
 $('script,style,noscript,nav,footer,header,aside,form,[aria-hidden="true"]').remove()
 if(!body){
  const containers=$('[itemprop="articleBody"],article,main');
  containers.each((_,el)=>{const text=$(el).find('p,h2,h3,li').map((_,p)=>$(p).text().trim()).get().filter(Boolean).join('\n\n'); if(text.length>body.length)body=text})
 }
 body=load(body).root().text().replace(/[ \t]+/g,' ').trim() || body.trim()
 // Keep paragraph boundaries from plain text rather than treating the body as HTML.

 const truncated=body.length>100000; body=body.slice(0,100000)
 if(body.length<200)return null
 const partial=restricted||truncated||/continua a leggere|abbonati per|subscribe to (?:continue|read)|read the full article|continue reading/i.test(body)
 return {body,status:(partial?'partial':structured&&free?'full':'unverified') as ContentStatus}
}