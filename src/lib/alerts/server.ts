import 'server-only'
import webpush from 'web-push'
import { getServiceSupabase } from '@/lib/server/clients'
import { readEditorial } from '@/lib/server/editorial'
import { editorialAllowed } from '@/lib/ai/editorial'
import { sameEvent,type StoryArticle } from '@/lib/articles/stories'
import { alertCandidate,defaultAlertSettings,validPushEndpoint,type AlertSettings } from './rules'
export async function readAlertSettings(userId:string){const {data,error}=await getServiceSupabase().from('alert_settings').select('*').eq('user_id',userId).maybeSingle();if(error)throw error;return data??{...defaultAlertSettings,enabled_since:new Date().toISOString(),updated_at:null}}
export function pushReady(){return Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY)}
export async function runAlerts(userId:string){
 const db=getServiceSupabase();const settings=await readAlertSettings(userId)
 if(!settings.enabled)return {created:0,delivered:0,failed:0}
 const [articles,previous,profile]=await Promise.all([
 db.from('articles').select('id,title,excerpt,url,source_id,published_at,created_at,sources!inner(user_id,is_active)').eq('sources.user_id',userId).eq('sources.is_active',true).is('duplicate_of',null).gte('created_at',settings.enabled_since).order('created_at',{ascending:false}).limit(300),
 db.from('news_alerts').select('article_id,articles(id,title,published_at,created_at,url)').eq('user_id',userId).gte('created_at',new Date(Date.now()-86400000).toISOString()).limit(100),readEditorial(userId)])
 if(articles.error||previous.error)throw articles.error||previous.error
 const old=((previous.data??[]) as unknown as {articles:StoryArticle|null}[]).flatMap(row=>row.articles?[row.articles]:[])
 const candidates=(articles.data??[]).flatMap(article=>{
  if(!editorialAllowed(article,profile.interests)||old.some(item=>sameEvent({...article,sources:null},{...item,sources:null})))return []
  const choice=alertCandidate(article,settings as AlertSettings);return choice?[{article_id:article.id,...choice}]:[]
 }).sort((a,b)=>b.score-a.score).slice(0,30)
 const {data:reserved,error}=await db.rpc('athena_reserve_alert',{p_user:userId,p_candidates:candidates});if(error)throw error
 const delivery=await deliverPush(userId)
 return {created:reserved?1:0,...delivery}
}
export async function deliverPush(userId:string){
 if(!pushReady())return {delivered:0,failed:0}
 const db=getServiceSupabase();const {data:claims,error}=await db.rpc('athena_claim_push',{p_user:userId});if(error)throw error
 let delivered=0,failed=0
 await Promise.all(((claims??[]) as {alert_id:string;subscription_id:string}[]).map(async claim=>{
  const {data:subscription,error:readError}=await db.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id',userId).eq('id',claim.subscription_id).eq('active',true).maybeSingle()
  if(readError)throw readError
  let status='expired',message:string|null=null
  if(subscription&&validPushEndpoint(subscription.endpoint))try{
   await webpush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify({title:'Athena · nuovo aggiornamento',body:'Una notizia corrisponde ai tuoi avvisi. Apri Athena per leggerla.',url:`/?avviso=${claim.alert_id}`,tag:`athena-${claim.alert_id}`}),{TTL:3600,urgency:'normal',timeout:8000,vapidDetails:{subject:'https://athena-os.vercel.app',publicKey:process.env.VAPID_PUBLIC_KEY!,privateKey:process.env.VAPID_PRIVATE_KEY!}})
   status='sent';delivered++
  }catch(error){const code=error&&typeof error==='object'&&'statusCode'in error?Number(error.statusCode):0;status=[404,410].includes(code)?'expired':'failed';message=code?`Servizio push: HTTP ${code}`:'Servizio push non raggiungibile';failed++
   if(status==='expired'){const {error:disableError}=await db.from('push_subscriptions').update({active:false,last_error:message}).eq('user_id',userId).eq('id',claim.subscription_id);if(disableError)throw disableError}
  }
  const {error:writeError}=await db.from('push_deliveries').update({status,last_error:message,...(status==='sent'?{sent_at:new Date().toISOString()}:{})}).eq('user_id',userId).eq('alert_id',claim.alert_id).eq('subscription_id',claim.subscription_id);if(writeError)throw writeError
 }))
 return {delivered,failed}
}
