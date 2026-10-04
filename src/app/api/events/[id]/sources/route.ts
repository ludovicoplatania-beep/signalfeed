import {NextResponse} from 'next/server'
import {z} from 'zod'
import {requireOwner,enforceRateLimit} from '@/lib/server/auth'
import {apiError} from '@/lib/server/api'
import {getServiceSupabase} from '@/lib/server/clients'
import {safeFetchText} from '@/lib/server/safeFetch'
import {extractPrimaryLinks,primaryUrl} from '@/lib/events/primary'
export const maxDuration=60
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const owner=await requireOwner(request);const id=z.string().uuid().parse((await params).id);const db=getServiceSupabase()
 const {data:event,error}=await db.from('news_events').select('id').eq('id',id).eq('user_id',owner.id).maybeSingle()
 if(error)throw error;if(!event)return NextResponse.json({success:false,message:'Evento non trovato'},{status:404})
 enforceRateLimit(`event-sources:${owner.id}`,3,60000)
 const {data,error:coverageError}=await db.from('event_articles').select('article_id,articles!inner(title,url,sources!inner(user_id))').eq('event_id',id).eq('user_id',owner.id).eq('articles.sources.user_id',owner.id).order('added_at',{ascending:false}).limit(6)
 if(coverageError)throw coverageError
 const links=new Map<string,{user_id:string;event_id:string;article_id:string;url:string;label:string;checked_at:string}>()
 let failed=0;let next=0
 await Promise.all(Array.from({length:Math.min(3,data?.length??0)},async()=>{
  while(data&&next<data.length){const member=data[next++];const article=member.articles as unknown as {title:string;url:string}
   const own=primaryUrl(article.url)
   if(own)links.set(own,{user_id:owner.id,event_id:id,article_id:member.article_id,url:own,label:article.title.slice(0,200),checked_at:new Date().toISOString()})
   try{const page=await safeFetchText(article.url,'text/html',AbortSignal.timeout(10000))
    for(const link of extractPrimaryLinks(page.text,page.url))links.set(link.url,{user_id:owner.id,event_id:id,article_id:member.article_id,...link,checked_at:new Date().toISOString()})
   }catch{failed++}
  }
 }))
 if(links.size){const {error:writeError}=await db.from('event_primary_links').upsert([...links.values()],{onConflict:'event_id,url'});if(writeError)throw writeError}
 const message=`Controllate ${data?.length??0} coperture recenti · ${links.size} collegamenti ufficiali trovati${failed?` · ${failed} pagine non recuperabili`:''}.`
 const {error:updateError}=await db.from('news_events').update({primary_checked_at:new Date().toISOString(),primary_check_message:message}).eq('id',id).eq('user_id',owner.id)
 if(updateError)throw updateError
 return NextResponse.json({success:true,message},{headers:{'Cache-Control':'private, no-store'}})
}catch(error){if(error instanceof z.ZodError)return NextResponse.json({success:false,message:'Evento non valido'},{status:400});return apiError(error,'Verifica fonti primarie non riuscita')}}
