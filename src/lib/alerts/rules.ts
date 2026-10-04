import { z } from 'zod'
import { classifyArticle, sectors } from '@/lib/sectors/catalog'
import { meaningfulTokens } from '@/lib/ai/preferences'
export const alertSettingsSchema=z.object({enabled:z.boolean(),sectors:z.array(z.enum(sectors.map(s=>s.slug) as [string,...string[]])).max(9),keywords:z.array(z.string().trim().min(2).max(80)).max(12),max_per_day:z.number().int().min(1).max(5),interval_minutes:z.number().int().min(60).max(720),quiet_start:z.number().int().min(0).max(23),quiet_end:z.number().int().min(0).max(23),timezone:z.string().max(80).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}})}).strict()
export type AlertSettings=z.infer<typeof alertSettingsSchema>
export const defaultAlertSettings:AlertSettings={enabled:false,sectors:[],keywords:[],max_per_day:3,interval_minutes:120,quiet_start:22,quiet_end:8,timezone:'Europe/Rome'}
export function matchesKeyword(text:string,keyword:string){const words=meaningfulTokens(keyword);if(!words.size)return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).includes(keyword.toLowerCase());const hay=meaningfulTokens(text);return [...words].every(word=>hay.has(word))}
export function alertCandidate(article:{title:string;excerpt:string|null;published_at:string|null;created_at:string},settings:AlertSettings,now=Date.now()){
 const published=Date.parse(article.published_at??article.created_at)
 if(!Number.isFinite(published)||now-published>86400000||published>now+300000)return null
 const text=article.title+' '+(article.excerpt??'').slice(0,500)
 const matched=classifyArticle(article).filter(s=>settings.sectors.includes(s))
 const keywords=settings.keywords.filter(k=>matchesKeyword(text,k))
 if(!matched.length&&!keywords.length)return null
 // Require a concrete development; generic reviews, deals and evergreen commentary do not notify.
 if(/\b(recension[ei]|reviews?|offert[ae]|scont[oi]|deals?|opinion[ei]?|rumou?rs?|indiscrezion[a-z]*|guida|tutorial)\b/i.test(article.title))return null
 const signals=[/\b(annuncia|annunciato|annuncio|announces?|launch(?:es|ed)?|lancia|rilasci[oa]|release[ds]?|approvat[oa]|approves?|pubblicat[oa]|unveils?)\b/i,/\b(sentenza|ruling|decisione|decision|decreto|legge|law|riforma|arrest[oa]|arrests?|vulnerabilit[aà]|vulnerability|data breach|allerta|emergenza|emergency|chiusura|shutdown)\b/i,/\b(nuovo|nuova|new|ufficiale|official|disponibile|available|entra in vigore|in force)\b/i]
 const impact=signals.filter(pattern=>pattern.test(article.title)).length
 if(!signals.slice(0,2).some(pattern=>pattern.test(article.title)))return null
 return {score:impact*25+Math.min(keywords.length,2)*15+Math.min(matched.length,2)*5,reason:`Sviluppo rilevato nel titolo · ${[...matched.map(slug=>sectors.find(s=>s.slug===slug)!.name),...keywords].join(', ')}`.slice(0,300)}
}
export function isQuiet(settings:Pick<AlertSettings,'quiet_start'|'quiet_end'|'timezone'>,date=new Date()){
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:settings.timezone,hour:'2-digit',hourCycle:'h23'}).format(date))
 return settings.quiet_start===settings.quiet_end?false:settings.quiet_start<settings.quiet_end?hour>=settings.quiet_start&&hour<settings.quiet_end:hour>=settings.quiet_start||hour<settings.quiet_end
}
export function validPushEndpoint(value:string){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&url.pathname.length>4&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(host=>url.hostname===host||url.hostname.endsWith('.'+host))}catch{return false}}
