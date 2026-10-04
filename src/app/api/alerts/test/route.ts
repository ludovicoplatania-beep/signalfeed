import { NextResponse } from 'next/server'
import { z } from 'zod'
import webpush from 'web-push'
import { requireOwner,enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { getServiceSupabase } from '@/lib/server/clients'
import { validPushEndpoint } from '@/lib/alerts/rules'
import { pushReady } from '@/lib/alerts/server'
export const maxDuration=30
export async function POST(request:Request){try{
 const owner=await requireOwner(request);enforceRateLimit(`push-test:${owner.id}`,1)
 const {endpoint}=z.object({endpoint:z.string().max(2048).refine(validPushEndpoint)}).strict().parse(await request.json())
 if(!pushReady())return NextResponse.json({message:'Invio push non configurato'},{status:503})
 const db=getServiceSupabase();const {data:subscription,error}=await db.from('push_subscriptions').select('id,endpoint,p256dh,auth').eq('user_id',owner.id).eq('endpoint',endpoint).eq('active',true).maybeSingle()
 if(error)throw error;if(!subscription)return NextResponse.json({message:'Attiva prima il push su questo dispositivo.'},{status:404})
 try{await webpush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify({type:'test',tag:'athena-push-test',url:'/'}),{TTL:60,urgency:'normal',timeout:8000,vapidDetails:{subject:'https://athena-os.vercel.app',publicKey:process.env.VAPID_PUBLIC_KEY!,privateKey:process.env.VAPID_PRIVATE_KEY!}})}catch(error){
  const code=error&&typeof error==='object'&&'statusCode'in error?Number(error.statusCode):0
  if([404,410].includes(code)){const {error:disableError}=await db.from('push_subscriptions').update({active:false,last_error:`Prova push: HTTP ${code}`}).eq('user_id',owner.id).eq('id',subscription.id);if(disableError)throw disableError}
  return NextResponse.json({message:[404,410].includes(code)?'Iscrizione scaduta. Disattiva e riattiva il push su questo dispositivo.':'Servizio push non raggiungibile. Riprova tra un minuto.'},{status:502})
 }
 return NextResponse.json({success:true,message:'Notifica di prova accettata dal servizio push. Controlla questo dispositivo; l’accettazione non conferma la ricezione.'},{headers:{'Cache-Control':'private, no-store'}})
}catch(error){if(error instanceof z.ZodError)return NextResponse.json({message:'Dispositivo non valido'},{status:400});return apiError(error,'Prova push non riuscita')}}
