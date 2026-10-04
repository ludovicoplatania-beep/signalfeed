import 'server-only'
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions'
import { MeterError, reserveAttempt, settleAttempt } from './meter'
import { getOpenAI } from '@/lib/server/clients'

export type AIFailure = 'timeout' | 'rate_limit' | 'quota' | 'credentials' | 'provider' | 'incomplete' | 'refusal' | 'invalid_response' | 'budget' | 'metering'
export class AICompletionError extends Error {
  constructor(public code: AIFailure, public attempts: number, public elapsedMs: number) {
    super(`AI completion failed: ${code}`)
  }
}
export type CompletionOptions = { stage: string; budgetMs?: number }

export function failureCode(error: unknown): AIFailure {
  if (error instanceof MeterError) return error.code
  if (error instanceof AICompletionError) return error.code
  const value = error as { name?: string; status?: number; code?: string; message?: string } | null
  if (value?.code === 'insufficient_quota') return 'quota'
  if (value?.status === 401 || value?.status === 403) return 'credentials'
  if (value?.status === 429) return 'rate_limit'
  if (value?.name === 'APIConnectionTimeoutError' || value?.name === 'AbortError' || /timed?\s*out|timeout/i.test(value?.message ?? '')) return 'timeout'
  if (!value?.status || value.status === 408 || value.status === 409 || value.status >= 500) return 'provider'
  return 'invalid_response'
}

// SDK retries are disabled: each stage owns one deadline and at most two attempts.
export async function createAICompletion(params: ChatCompletionCreateParamsNonStreaming, options: CompletionOptions) {
  const started = Date.now()
  const budget = Math.max(1, options.budgetMs ?? 45_000)
  let attempts = 0
  let code: AIFailure = 'timeout'
  while (attempts < 2) {
    const remaining = budget - (Date.now() - started)
    if (remaining <= 0 || (attempts > 0 && remaining < 8_000)) break
    attempts++
    let meterId: string | undefined
    let responseReceived = false
    try {
      const request = attempts > 1 && code === 'incomplete'
        ? { ...params, max_completion_tokens: Math.min(4_096, Math.ceil((params.max_completion_tokens ?? 2_000) * 1.5)) }
        : params
      meterId = await reserveAttempt(request, options.stage)
      const response = await getOpenAI().chat.completions.create(request, { timeout: Math.min(40_000, Math.ceil(budget * 0.65), remaining), maxRetries: 0 })
      responseReceived = true
      await settleAttempt(meterId, response.usage)
      const choice = response.choices[0]
      if (choice?.message.refusal) throw new AICompletionError('refusal', attempts, Date.now() - started)
      if (choice?.finish_reason === 'length') throw new AICompletionError('incomplete', attempts, Date.now() - started)
      if (!choice?.message.content) throw new AICompletionError('invalid_response', attempts, Date.now() - started)
      console.info('AI completion', { stage: options.stage, attempts, elapsedMs: Date.now() - started,
        requestId: response._request_id, finishReason: choice.finish_reason,
        inputTokens: response.usage?.prompt_tokens, outputTokens: response.usage?.completion_tokens })
      return { response, attempts, elapsedMs: Date.now() - started }
    } catch (error) {
      code = failureCode(error)
      if (meterId && !responseReceived) {
        try { await settleAttempt(meterId, undefined, error) } catch { code = 'metering' }
      }
      console.warn('AI completion attempt failed', { stage: options.stage, attempts, code, elapsedMs: Date.now() - started })
      if (!['timeout', 'rate_limit', 'provider', 'incomplete'].includes(code)) break
      if (attempts < 2 && budget - (Date.now() - started) >= 8_500) await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  throw new AICompletionError(code, attempts, Date.now() - started)
}

export function failureMessage(code: AIFailure) {
  const messages: Record<AIFailure, string> = {
    budget: 'tetto mensile IA raggiunto', metering: 'misurazione dei costi non disponibile',
    timeout: 'tempo di risposta esaurito', rate_limit: 'limite temporaneo del servizio', quota: 'credito API esaurito',
    credentials: 'accesso API rifiutato', provider: 'servizio temporaneamente irraggiungibile',
    incomplete: 'risposta interrotta', refusal: 'richiesta rifiutata dal servizio', invalid_response: 'risposta non valida',
  }
  return messages[code]
}
