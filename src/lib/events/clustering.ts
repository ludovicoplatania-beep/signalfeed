import {z} from 'zod'
export const eventProposal=z.object({title:z.string().min(1).max(180),synopsis:z.string().max(600),articles:z.array(z.object({ref:z.number().int().positive(),language:z.enum(['it','en','fr','de','es','other']),focus:z.string().max(240)})).min(2).max(12)})
export function validGroups(raw:unknown,ids:string[]){
 const values=z.object({events:z.array(z.unknown()).max(12)}).parse(raw).events
 const seen=new Set<string>()
 return values.flatMap(value=>{
  const parsed=eventProposal.safeParse(value);if(!parsed.success)return[]
  const articles=parsed.data.articles.flatMap(member=>{const id=ids[member.ref-1];if(!id||seen.has(id))return[];return[{article_id:id,language:member.language,focus:member.focus}]})
  const unique=articles.filter((member,index)=>articles.findIndex(other=>other.article_id===member.article_id)===index)
  if(unique.length<2)return[]
  unique.forEach(member=>seen.add(member.article_id))
  return [{title:parsed.data.title,synopsis:parsed.data.synopsis,articles:unique}]
 })
}
