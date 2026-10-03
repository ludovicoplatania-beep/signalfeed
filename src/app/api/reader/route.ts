import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOwner,enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { getServiceSupabase } from '@/lib/server/clients'
import { safeFetchText } from '@/lib/server/safeFetch'
import { extractReader,fallbackReader } from '@/lib/articles/reader'
export const maxDuration=30
export async function GET(request:Request){
 try{
  const owner=await requireOwner(request); const id=z.string().uuid().parse(new URL(request.url).searchParams.get('id')); const db=getServiceSupabase()
  const {data:article,error}=await db.from('articles').select('id,url,excerpt,article_content,sources!inner(user_id)').eq('id',id).eq('sources.user_id',owner.id).maybeSingle()
  if(error)throw error; if(!article)return NextResponse.json({success:false,message:'Articolo non trovato'},{status:404})
  const {data:cache,error:cacheError}=await db.from('reader_cache').select('body,content_status,checked_at').eq('user_id',owner.id).eq('article_id',id).maybeSingle()
  if(cacheError)throw cacheError
  if(cache&&Date.now()-Date.parse(cache.checked_at)<(cache.content_status==='partial'?300000:86400000))return NextResponse.json({success:true,body:cache.body,status:cache.content_status},{headers:{'Cache-Control':'private, no-store'}})
  enforceRateLimit(`reader:${owner.id}`,20)
  let content=fallbackReader(article.article_content,article.excerpt); let message:string|null=null
  try{const page=await safeFetchText(article.url,'text/html',AbortSignal.timeout(12000)); const extracted=extractReader(page.text,page.url); if(extracted&&extracted.body.length>content.body.length)content=extracted; else message='La fonte non ha fornito un testo più completo.'}
  catch{message='Testo della pagina non recuperabile. È disponibile l’estratto importato.'}
  const {error:writeError}=await db.from('reader_cache').upsert({user_id:owner.id,article_id:id,body:content.body,content_status:content.status,checked_at:new Date().toISOString()},{onConflict:'user_id,article_id'})
  if(writeError)throw writeError
  return NextResponse.json({success:true,...content,message},{headers:{'Cache-Control':'private, no-store'}})
 }catch(error){if(error instanceof z.ZodError)return NextResponse.json({success:false,message:'Articolo non valido'},{status:400});return apiError(error,'Errore caricamento lettore')}
}
