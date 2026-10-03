import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/server/api'
import { requireOwner,enforceRateLimit } from '@/lib/server/auth'
import { readEditorial,writeEditorial } from '@/lib/server/editorial'
import { manualSchema,manualInterests } from '@/lib/ai/editorial'
import { getServiceSupabase } from '@/lib/server/clients'
import { loadCandidates } from '@/lib/ai/pickArticles'
import { automaticPicks,selectionPool,diversifyPicks } from '@/lib/ai/ranking'
import type { Feedback } from '@/lib/ai/preferences'
export const maxDuration=60
const schema=z.object({manual:manualSchema,version:z.string().nullable()}).strict()
export async function GET(request:Request) {
 try {
  const owner=await requireOwner(request); const profile=await readEditorial(owner.id)
  let preview
  if(new URL(request.url).searchParams.get('preview')==='1') {
   enforceRateLimit(`preference-preview:${owner.id}`,10)
   const db=getServiceSupabase()
   const [articles,feedback,events]=await Promise.all([loadCandidates(owner.id),db.from('article_feedback').select('*').eq('user_id',owner.id).not('preference','is',null).limit(1000),db.from('user_events').select('article_id').eq('user_id',owner.id).eq('event_type','article_opened').order('created_at',{ascending:false}).limit(2000)])
   if(feedback.error||events.error) throw feedback.error||events.error
   const read=new Set<string>((events.data??[]).map(e=>e.article_id)); const votes=(feedback.data??[]) as Feedback[]
   const pool=selectionPool(articles,profile.interests,read,votes)
   const byId=new Map(pool.map(a=>[a.id,a]))
   preview=diversifyPicks(automaticPicks(pool,profile.interests,read,votes),pool,10).map(p=>({...p,title:byId.get(p.id)!.title,source:byId.get(p.id)!.source_name}))
  }
  return NextResponse.json({manual:manualInterests(profile.interests),learned:profile.interests.filter(i=>i.origin!=='manual'),version:profile.version,preview},{headers:{'Cache-Control':'private, no-store'}})
 } catch(error) {return apiError(error,'Preferenze non disponibili')}
}
export async function POST(request:Request) {
 try {
  const owner=await requireOwner(request); enforceRateLimit(`preferences:${owner.id}`,30)
  const body=schema.parse(await request.json()); const sourceIds=body.manual.flatMap(i=>i.source_id?[i.source_id]:[])
  if(sourceIds.length) {
   const {data,error}=await getServiceSupabase().from('sources').select('id').eq('user_id',owner.id).in('id',sourceIds)
   if(error) throw error
   if(data?.length!==new Set(sourceIds).size) return NextResponse.json({message:'Fonte non disponibile'},{status:400})
  }
  const saved=await writeEditorial(owner.id,body.manual,body.version,'manual')
  return NextResponse.json({manual:manualInterests(saved.interests),learned:saved.interests.filter(i=>i.origin!=='manual'),version:saved.version},{headers:{'Cache-Control':'private, no-store'}})
 } catch(error) {
  if(error instanceof z.ZodError)return NextResponse.json({message:'Preferenze non valide: verifica temi e priorità.'},{status:400})
  if(error instanceof Error&&error.message==='PREFERENCES_CONFLICT')return NextResponse.json({message:'Preferenze cambiate su un altro dispositivo. Ricarica prima di salvare.'},{status:409})
  return apiError(error,'Preferenze non salvate')
 }
}
