import 'server-only'
import {getServiceSupabase} from '@/lib/server/clients'
import {sameEvent,type StoryArticle} from '@/lib/articles/stories'
export async function attachEventUpdates(userId:string){
 const db=getServiceSupabase()
 const [stored,recent]=await Promise.all([
  db.from('event_articles').select('article_id,event_id,articles(id,title,url,published_at,sources(name)),news_events(title,synopsis)').eq('user_id',userId).order('added_at',{ascending:false}).limit(400),
  db.from('articles').select('id,title,url,published_at,sources!inner(name,user_id,is_active)').eq('sources.user_id',userId).eq('sources.is_active',true).is('duplicate_of',null).order('created_at',{ascending:false}).limit(240),
 ])
 if(stored.error)throw stored.error;if(recent.error)throw recent.error
 if(!stored.data?.length)return{added:0}
 const assigned=new Set(stored.data.map(member=>member.article_id))
 const groups=new Map<string,{title:string;synopsis:string;articles:{article_id:string;language:string;focus:string}[]}>()
 for(const row of recent.data??[]){if(assigned.has(row.id))continue
  const candidate=row as unknown as StoryArticle
  const match=stored.data.find(member=>member.articles&&sameEvent(member.articles as unknown as StoryArticle,candidate))
  if(!match)continue
  const event=match.news_events as unknown as {title:string;synopsis:string}
  const group=groups.get(match.event_id)??{...event,articles:[{article_id:match.article_id,language:'other',focus:''}]}
  group.articles.push({article_id:row.id,language:'other',focus:row.title.slice(0,240)})
  groups.set(match.event_id,group);assigned.add(row.id)
 }
 let added=0
 for(const group of groups.values())for(let start=1;start<group.articles.length;start+=11){
  const values=[{...group,articles:[group.articles[0],...group.articles.slice(start,start+11)]}]
  const {data,error}=await db.rpc('athena_upsert_events',{p_user:userId,p_events:values});if(error)throw error
  added+=(data??[]).reduce((sum:number,item:{added:number})=>sum+item.added,0)
 }
 return{added}
}
