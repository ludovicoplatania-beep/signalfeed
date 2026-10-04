import {NextResponse} from 'next/server'
import {z} from 'zod'
import {requireOwner} from '@/lib/server/auth'
import {apiError} from '@/lib/server/api'
import {getServiceSupabase} from '@/lib/server/clients'
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const owner=await requireOwner(request);const id=z.string().uuid().parse((await params).id)
 const db=getServiceSupabase()
 const {data:event,error}=await db.from('news_events').select('*').eq('user_id',owner.id).eq('id',id).maybeSingle()
 if(error)throw error
 if(!event)return NextResponse.json({success:false,message:'Evento non trovato'},{status:404})
 const [coverage,primary]=await Promise.all([
  db.from('event_articles').select('article_id,language,focus,added_at,articles!inner(id,title,url,excerpt,image_url,published_at,sources!inner(name,user_id))').eq('user_id',owner.id).eq('event_id',id).eq('articles.sources.user_id',owner.id).order('added_at',{ascending:false}).limit(500),
  db.from('event_primary_links').select('url,label,article_id,checked_at').eq('user_id',owner.id).eq('event_id',id),
 ])
 if(coverage.error)throw coverage.error;if(primary.error)throw primary.error
 return NextResponse.json({success:true,event,coverage:(coverage.data??[]).map(member=>({...member,articles:{...member.articles,article_content:null}})),primary:primary.data},{headers:{'Cache-Control':'private, no-store'}})
}catch(error){if(error instanceof z.ZodError)return NextResponse.json({success:false,message:'Evento non valido'},{status:400});return apiError(error,'Evento non disponibile')}}
