import * as cheerio from 'cheerio'
const officialHosts=['openai.com','anthropic.com','deepmind.google','blog.google','nvidianews.nvidia.com','news.microsoft.com','blogs.microsoft.com','apple.com','news.samsung.com','about.fb.com','ai.meta.com','europa.eu','eur-lex.europa.eu','curia.europa.eu','consilium.europa.eu','ec.europa.eu','cortecassazione.it','cortecostituzionale.it','giustizia.it','gazzettaufficiale.it','normattiva.it','governo.it','quirinale.it','comune.catania.it','regione.sicilia.it','nasa.gov','esa.int','who.int','playstation.com','news.xbox.com','nintendo.com','store.steampowered.com']
export function primaryUrl(raw:string,base?:string){
 try{const url=new URL(raw,base);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.pathname==='/'||url.pathname.length<4)return null
  const host=url.hostname.toLowerCase().replace(/^www\./,'')
  if(/^(community|forum|forums)\./.test(host))return null
  if(!officialHosts.some(official=>host===official||host.endsWith('.'+official)))return null
  if(/^\/(blog|newsroom|news|research|about|home|company|products)\/?$/i.test(url.pathname)||/privacy|cookies|terms|login|sign-in|contact|subscribe/i.test(url.pathname))return null
  url.hash='';return url.toString()
 }catch{return null}
}
export function extractPrimaryLinks(html:string,base:string){
 const $=cheerio.load(html);$('nav,header,footer,aside,.related,.newsletter').remove()
 const region=$('article,main').first();const content=region.length?region:$('body')
 const links=new Map<string,{url:string;label:string}>()
 content.find('a[href]').each((_,node)=>{const anchor=$(node);const url=primaryUrl(anchor.attr('href')??'',base);const label=anchor.text().replace(/\s+/g,' ').trim().slice(0,200);if(url&&label)links.set(url,{url,label})})
 return [...links.values()].slice(0,20)
}
