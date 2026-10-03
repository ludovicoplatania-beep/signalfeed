import 'server-only'
import { getServiceSupabase } from './clients'
import { manualInterests, type Interest } from '@/lib/ai/editorial'
export async function readEditorial(user:string) {
  const {data,error}=await getServiceSupabase().from('user_interests').select('interests,updated_at').eq('user_id',user).maybeSingle()
  if(error) throw error
  return {interests:(data?.interests??[]) as Interest[],version:data?.updated_at??null,exists:Boolean(data)}
}
export async function writeEditorial(user:string,items:Interest[],version:string|null,kind:'manual'|'learned') {
  for(let attempt=0;attempt<3;attempt++) {
    const current=await readEditorial(user)
    if(kind==='manual' && current.version!==version) throw new Error('PREFERENCES_CONFLICT')
    let interests=kind==='manual' ? [...current.interests.filter(i=>i.origin!=='manual'),...items] : [...items,...manualInterests(current.interests)]
    const updated_at=new Date(Math.max(Date.now(),new Date(current.version??0).getTime()+1)).toISOString()
    if(kind==='learned') interests=interests.map(i=>({...i,learned_at:updated_at}))
    const db=getServiceSupabase()
    const result=current.exists ? await db.from('user_interests').update({interests,updated_at}).eq('user_id',user).eq('updated_at',current.version!).select('user_id').maybeSingle() : await db.from('user_interests').insert({user_id:user,interests,updated_at}).select('user_id').maybeSingle()
    if(result.error && result.error.code!=='23505') throw result.error
    if(result.data) return {interests,version:updated_at}
    if(kind==='manual') throw new Error('PREFERENCES_CONFLICT')
  }
  throw new Error('Profilo modificato contemporaneamente; riprova.')
}
