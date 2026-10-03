import 'server-only'
import { createHash } from 'node:crypto'
import { enforceRateLimit, requireCron, UnauthorizedError } from './auth'
import { getServiceSupabase } from './clients'

// The legacy secret keeps working. The database scheduler gets a separate
// credential accepted only by the RSS endpoint, never by the AI cron route.
export async function requireRssCron(request: Request) {
  try { requireCron(request); return } catch (error) {
    if (!(error instanceof UnauthorizedError)) throw error
  }
  const authorization = request.headers.get('authorization') ?? ''
  if (!/^Bearer [a-f0-9]{64}$/.test(authorization)) throw new UnauthorizedError('Credenziali cron non valide')
  enforceRateLimit('rss-cron-token-check', 30)
  const hash = createHash('sha256').update(authorization.slice(7)).digest('hex')
  const {data,error} = await getServiceSupabase().rpc('athena_validate_rss_cron', {p_hash:hash})
  if (error || data !== true) throw new UnauthorizedError('Credenziali cron non valide')
}
