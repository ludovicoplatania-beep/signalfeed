import 'server-only'
import crypto from 'node:crypto'
import type { User } from '@supabase/supabase-js'
import { getServerEnv } from './env'
import { getServiceSupabase } from './clients'

export class UnauthorizedError extends Error {}
export class RateLimitError extends Error {}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice(7).trim() || null
}

export async function requireUser(request: Request): Promise<User> {
  const token = bearerToken(request)
  if (!token) throw new UnauthorizedError('Sessione mancante')

  const { data, error } = await getServiceSupabase().auth.getUser(token)
  if (error || !data.user) throw new UnauthorizedError('Sessione non valida')
  return data.user
}

export function requireCron(request: Request): void {
  const supplied = bearerToken(request)
  const expected = getServerEnv().CRON_SECRET

  if (!supplied) throw new UnauthorizedError('Credenziali cron mancanti')

  const suppliedBuffer = Buffer.from(supplied)
  const expectedBuffer = Buffer.from(expected)
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    throw new UnauthorizedError('Credenziali cron non valide')
  }
}

type RateEntry = { count: number; resetAt: number }
const rateEntries = new Map<string, RateEntry>()

export function enforceRateLimit(key: string, limit = 5, windowMs = 60_000): void {
  const now = Date.now()
  const existing = rateEntries.get(key)
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing

  entry.count += 1
  rateEntries.set(key, entry)
  if (entry.count > limit) throw new RateLimitError('Troppe richieste')

  if (rateEntries.size > 5_000) {
    for (const [entryKey, value] of rateEntries) {
      if (value.resetAt <= now) rateEntries.delete(entryKey)
    }
  }
}
