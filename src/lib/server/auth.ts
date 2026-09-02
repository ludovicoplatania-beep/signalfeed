import 'server-only'
import crypto from 'node:crypto'
import { ACCESS_COOKIE, verifyAccessToken } from '@/lib/auth/session'
import { getServerEnv } from './env'

export class UnauthorizedError extends Error {}
export class RateLimitError extends Error {}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice(7).trim() || null
}

function requestCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  for (const part of cookieHeader.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return undefined
}

export async function requireOwner(request: Request) {
  const env = getServerEnv()
  const valid = await verifyAccessToken(requestCookie(request, ACCESS_COOKIE), env.APP_SESSION_SECRET)
  if (!valid) throw new UnauthorizedError('Accesso richiesto')
  return { id: env.OWNER_USER_ID }
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
