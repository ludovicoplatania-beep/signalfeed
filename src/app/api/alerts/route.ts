import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOwner,enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { getServiceSupabase } from '@/lib/server/clients'
import { alertSettingsSchema } from '@/lib/alerts/rules'
import { readAlertSettings,pushReady } from '@/lib/alerts/server'
const headers={'Cache-Control':'private, no-store'}
export async function GET(request:Request){try{
 const owner=await requireOwner(request),db=getServiceSupabase()
 const [settings,alerts,deliveries]=await Promise.all([readAlertSettings(owner.id),db.from('news_alerts').select('id,reason,created_at,read_at,articles!inner(id,title,url,excerpt,image_url,published_at,sources!inner(name,user_id))').eq('user_id',owner.id).eq('articles.sources.user_id',owner.id).order('created_at',{ascending:false}).limit(100),db.from('push_deliveries').select('status,last_error,attempted_at').eq('user_id',owner.id).order('attempted_at',{ascending:false,nullsFirst:false}).limit(20)])
 if(alerts.error||deliveries.error)throw alerts.error||deliveries.error
 return NextResponse.json({settings,alerts:alerts.data??[],deliveries:deliveries.data??[],pushReady:pushReady(),publicKey:process.env.VAPID_PUBLIC_KEY??null},{headers})
}catch(error){return apiError(error,'Avvisi non disponibili')}}
const saveSchema=z.object({settings:alertSettingsSchema,version:z.string().nullable()}).strict()
export async function POST(request:Request){try{
 const owner=await requireOwner(request);enforceRateLimit(`alerts-settings:${owner.id}`,10)
 const {settings,version}=saveSchema.parse(await request.json());if(settings.enabled&&!settings.sectors.length&&!settings.keywords.length)return NextResponse.json({message:'Scegli almeno un settore o un argomento.'},{status:400})
 const current=await readAlertSettings(owner.id),db=getServiceSupabase(),now=new Date().toISOString()
 if(current.updated_at!==version)return NextResponse.json({message:'Preferenze cambiate su un altro dispositivo. Ricarica prima di salvare.'},{status:409})
 const values={...settings,user_id:owner.id,updated_at:now,enabled_since:!current.enabled&&settings.enabled?now:current.enabled_since}
 const result=version?await db.from('alert_settings').update(values).eq('user_id',owner.id).eq('updated_at',version).select('*').maybeSingle():await db.from('alert_settings').insert(values).select('*').maybeSingle()
 if(result.error?.code==='23505'||(!result.error&&!result.data))return NextResponse.json({message:'Preferenze modificate contemporaneamente. Ricarica.'},{status:409})
 if(result.error)throw result.error
 return NextResponse.json({settings:result.data},{headers})
}catch(error){if(error instanceof z.ZodError)return NextResponse.json({message:'Impostazioni non valide'},{status:400});return apiError(error,'Salvataggio avvisi non riuscito')}}
export async function PATCH(request:Request){try{const owner=await requireOwner(request);const {id}=z.object({id:z.uuid()}).strict().parse(await request.json());const {error}=await getServiceSupabase().from('news_alerts').update({read_at:new Date().toISOString()}).eq('user_id',owner.id).eq('id',id);if(error)throw error;return NextResponse.json({success:true},{headers})}catch(error){return apiError(error,'Avviso non aggiornato')}}
