import {canonicalArticleUrl} from '@/lib/articles/identity'
import type {Candidate} from '@/lib/ai/ranking'
// Event comparison needs competing coverage, not a personalised picks shortlist.
export function eventPool(articles:Candidate[],limit=240){
 const publishers=new Map<string,Candidate[]>()
 const seen=new Set<string>()
 for(const article of [...articles].sort((a,b)=>Date.parse(b.published_at??b.created_at)-Date.parse(a.published_at??a.created_at)||a.id.localeCompare(b.id))){
  let key:string;let publisher:string
  try{key=canonicalArticleUrl(article.url);publisher=new URL(key).hostname}catch{continue}
  if(seen.has(key))continue;seen.add(key)
  const group=publishers.get(publisher)??[];group.push(article);publishers.set(publisher,group)
 }
 const selected:Candidate[]=[]
 const groups=[...publishers.values()]
 for(let index=0;selected.length<limit;index++){
  let added=false
  for(const group of groups){if(!group[index])continue;selected.push(group[index]);added=true;if(selected.length===limit)break}
  if(!added)break
 }
 return selected
}
