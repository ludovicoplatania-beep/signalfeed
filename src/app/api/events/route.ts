import {NextResponse} from 'next/server'
import {requireOwner,enforceRateLimit} from '@/lib/server/auth'
import {apiError} from '@/lib/server/api'
import {getServiceSupabase} from '@/lib/server/clients'
import {syncEvents} from '@/lib/events/sync'
export const maxDuration=90
export async function GET(request:Request){try{
 const owner=await requireOwner(request)
 const {data,error}=await getServiceSupabase().from('news_events').select('id,title,synopsis,created_at,updated_at,event_articles(article_id,language)').eq('user_id',owner.id).order('updated_at',{ascending:false}).limit(100)
 if(error)throw error
 return NextResponse.json({success:true,events:data},{headers:{'Cache-Control':'private, no-store'}})
}catch(error){return apiError(error,'Eventi non disponibili')}}
export async function POST(request:Request){try{
 const owner=await requireOwner(request);enforceRateLimit(`events:${owner.id}`,1,60000)
 const result=await syncEvents(owner.id)
 return NextResponse.json({success:true,...result},{headers:{'Cache-Control':'private, no-store'}})
}catch(error){return apiError(error,'Aggiornamento eventi non riuscito. I gruppi precedenti sono conservati.')}}
