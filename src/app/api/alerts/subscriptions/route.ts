import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOwner,enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { getServiceSupabase } from '@/lib/server/clients'
import { validPushEndpoint } from '@/lib/alerts/rules'
import { pushReady } from '@/lib/alerts/server'
const endpoint=z.string().max(2048).refine(validPushEndpoint)
const schema=z.object({endpoint,keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{87}={0,2}$/),auth:z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/)}).strict()}).strict()
export async function POST(request:Request){try{
 const owner=await requireOwner(request);enforceRateLimit(`push:${owner.id}`,10)
 if(!pushReady())return NextResponse.json({message:'Invio push non configurato'},{status:503})
 const subscription=schema.parse(await request.json()),db=getServiceSupabase()
 const {count,error:countError}=await db.from('push_subscriptions').select('id',{count:'exact',head:true}).eq('user_id',owner.id).eq('active',true);if(countError)throw countError
 const {data:existing,error:existingError}=await db.from('push_subscriptions').select('id').eq('user_id',owner.id).eq('endpoint',subscription.endpoint).maybeSingle();if(existingError)throw existingError
 if(!existing&&(count??0)>=10)return NextResponse.json({message:'Limite di dieci dispositivi raggiunto.'},{status:400})
 const values={user_id:owner.id,endpoint:subscription.endpoint,p256dh:subscription.keys.p256dh,auth:subscription.keys.auth,active:true,last_error:null}
 const result=existing?await db.from('push_subscriptions').update(values).eq('user_id',owner.id).eq('id',existing.id):await db.from('push_subscriptions').insert(values);if(result.error)throw result.error
 return NextResponse.json({success:true},{headers:{'Cache-Control':'private, no-store'}})
}catch(error){if(error instanceof z.ZodError)return NextResponse.json({message:'Dispositivo push non compatibile'},{status:400});return apiError(error,'Attivazione push non riuscita')}}
export async function DELETE(request:Request){try{const owner=await requireOwner(request);const data=z.object({endpoint}).strict().parse(await request.json());const {error}=await getServiceSupabase().from('push_subscriptions').update({active:false}).eq('user_id',owner.id).eq('endpoint',data.endpoint);if(error)throw error;return NextResponse.json({success:true})}catch(error){return apiError(error,'Disattivazione push non riuscita')}}
