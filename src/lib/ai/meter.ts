import 'server-only'
import { getServiceSupabase } from '@/lib/server/clients'
import { getServerEnv } from '@/lib/server/env'
import { rateVersion, reservationCost, tokenCost } from './cost'
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions'
type CompletionUsage = {prompt_tokens:number;completion_tokens:number;prompt_tokens_details?:{cached_tokens?:number}}
export class MeterError extends Error { constructor(public code: 'budget' | 'metering') { super(code) } }
export async function reserveAttempt(request: ChatCompletionCreateParamsNonStreaming, stage: string) {
  try {
    const amount = reservationCost(request)
    const { data, error } = await getServiceSupabase().rpc('athena_reserve_ai', { p_owner: getServerEnv().OWNER_USER_ID, p_stage: stage, p_model: request.model, p_reserved: amount, p_rate: rateVersion })
    if (error) throw error
    if (!data?.allowed) throw new MeterError('budget')
    return data.id as string
  } catch (error) { if (error instanceof MeterError) throw error; throw new MeterError('metering') }
}
export async function settleAttempt(id: string, usage?: CompletionUsage, error?: unknown) {
  const status = (error as {status?:number})?.status
  const rejected = status !== undefined && [400,401,403,404,422,429].includes(status)
  const input = usage?.prompt_tokens ?? 0, output = usage?.completion_tokens ?? 0
  const cached = Math.max(0, Math.min(input, usage?.prompt_tokens_details?.cached_tokens ?? 0))
  const { error: dbError } = await getServiceSupabase().from('ai_usage').update({
    status: usage ? 'measured' : rejected ? 'rejected' : 'uncertain',
    input_tokens: usage ? input : null, output_tokens: usage ? output : null, cached_tokens: usage ? cached : null,
    cost_microusd: usage ? tokenCost(input, output, cached) : rejected ? 0 : null,
    finished_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', getServerEnv().OWNER_USER_ID)
  if (dbError) throw new MeterError('metering')
}
