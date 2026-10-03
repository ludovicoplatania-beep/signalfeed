import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/server/api'
import { requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'
const schema = z.object({article_id:z.string().uuid(),read:z.boolean().optional(),folder:z.string().trim().max(80).optional(),tags:z.array(z.string().trim().min(1).max(40)).max(12).optional()}).strict().refine(v=>v.read!==undefined||v.folder!==undefined||v.tags!==undefined)
export async function GET(request:Request) {
 try {
  const owner=await requireOwner(request); const db=getServiceSupabase(); const entries=[]
  for(let offset=0;;offset+=1000){
   const {data,error}=await db.from('article_library').select('article_id,read_at,folder,tags').eq('user_id',owner.id).order('article_id').range(offset,offset+999)
   if(error) throw error; entries.push(...(data??[])); if((data?.length??0)<1000) break
  }
  return NextResponse.json({success:true,entries},{headers:{'Cache-Control':'private, no-store'}})
 } catch(error){return apiError(error,'Errore caricamento biblioteca')}
}
export async function PATCH(request:Request){
 try {
  const owner=await requireOwner(request); const input=schema.parse(await request.json()); const db=getServiceSupabase()
  const {data:article,error:readError}=await db.from('articles').select('id,sources!inner(user_id)').eq('id',input.article_id).eq('sources.user_id',owner.id).maybeSingle()
  if(readError) throw readError; if(!article)return NextResponse.json({success:false,message:'Articolo non trovato'},{status:404})
  const update={user_id:owner.id,article_id:input.article_id,updated_at:new Date().toISOString(),...(input.read!==undefined?{read_at:input.read?new Date().toISOString():null}:{}),...(input.folder!==undefined?{folder:input.folder}:{}),...(input.tags!==undefined?{tags:[...new Set(input.tags)]}:{})}
  const {data,error}=await db.from('article_library').upsert([update],{onConflict:'user_id,article_id',defaultToNull:false}).select('article_id,read_at,folder,tags').single()
  if(error)throw error; return NextResponse.json({success:true,entry:data})
 }catch(error){if(error instanceof z.ZodError)return NextResponse.json({success:false,message:'Dati biblioteca non validi'},{status:400}); return apiError(error,'Errore aggiornamento biblioteca')}
}
