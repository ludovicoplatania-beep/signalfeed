import { classifyArticle } from '@/lib/sectors/catalog'
import { z } from 'zod'
import { meaningfulTokens } from './preferences'
export type Interest = { topic: string; score: number; origin?: 'manual'; mode?: 'prioritize' | 'exclude'; source_id?: string; learned_at?: string }
export const manualSchema = z.array(z.object({ topic:z.string().trim().min(2).max(100), score:z.number().int().min(0).max(100), origin:z.literal('manual'), mode:z.enum(['prioritize','exclude']), source_id:z.uuid().optional() }).strict()).max(40).refine(items=>new Set(items.map(i=>i.source_id ?? i.topic.toLocaleLowerCase())).size===items.length,'Temi o fonti duplicati')
export function manualInterests(items: Interest[] = []) { return items.filter(i=>i.origin==='manual').map(i=>({topic:i.topic,score:i.score,origin:'manual' as const,mode:i.mode,...(i.source_id?{source_id:i.source_id}:{})})) }
export function topicMatches(article:{title:string;excerpt?:string|null},topic:string) {
  const aliases:Record<string,string>={ia:'ia',ai:'ia','intelligenza artificiale':'ia',tecnologia:'tecnologia',videogiochi:'videogiochi',gaming:'videogiochi',diritto:'diritto',sicilia:'sicilia-catania',catania:'sicilia-catania'}
  const sector=aliases[topic.trim().toLowerCase()]
  if(sector)return classifyArticle(article).includes(sector as ReturnType<typeof classifyArticle>[number])
  const tokens=meaningfulTokens(article.title+' '+(article.excerpt??'').slice(0,300)); const words=[...meaningfulTokens(topic)]
  return words.length>0 && words.every(word=>tokens.has(word))
}
export function editorialAllowed(article:{source_id:string;title:string;excerpt?:string|null},items:Interest[]) {
  return !manualInterests(items).some(i=>i.mode==='exclude' && (i.source_id ? i.source_id===article.source_id : topicMatches(article,i.topic)))
}
export function editorialBoost(article:{title:string;excerpt?:string|null},items:Interest[]) {
  const matching=manualInterests(items).filter(i=>i.mode==='prioritize' && !i.source_id && topicMatches(article,i.topic)).sort((a,b)=>b.score-a.score)
  return {boost:matching[0] ? matching[0].score/5 : 0,topic:matching[0]?.topic}
}
