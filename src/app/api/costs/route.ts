import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'
import { apiError } from '@/lib/server/api'
import { budgetSchema } from '@/lib/backup/schema'
import { z } from 'zod'
const headers={'Cache-Control':'private, no-store'}
export async function GET(request:Request){try{
 const owner=await requireOwner(request),db=getServiceSupabase()
 const now=new Date(),start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString()
 const {data:budget,error:budgetError}=await db.from('ai_budget').select('enabled,monthly_limit_microusd').eq('user_id',owner.id).maybeSingle();if(budgetError)throw budgetError
 const {data,error}=await db.rpc('athena_ai_cost_summary',{p_owner:owner.id,p_start:start});if(error)throw error
 return NextResponse.json({success:true,budget:budget??{enabled:false,monthly_limit_microusd:5000000},...data},{headers})
}catch(error){return apiError(error,'Misurazione dei costi non disponibile')}}
export async function PATCH(request:Request){try{
 const owner=await requireOwner(request),input=budgetSchema.parse(await request.json())
 const {error}=await getServiceSupabase().from('ai_budget').upsert({user_id:owner.id,...input,updated_at:new Date().toISOString()});if(error)throw error
 return NextResponse.json({success:true},{headers})
}catch(error){if(error instanceof z.ZodError)return NextResponse.json({message:'Budget non valido'},{status:400});return apiError(error,'Budget non salvato')}}
