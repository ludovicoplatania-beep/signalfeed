import { requireCron } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { getServerEnv } from '@/lib/server/env'
import { enqueueUpdate } from '@/lib/server/updateResponse'

export const maxDuration = 300

export async function GET(request: Request) {
  try {
    requireCron(request)
    return await enqueueUpdate(getServerEnv().OWNER_USER_ID, 'all')
  } catch (error) {
    return apiError(error, 'Errore aggiornamento programmato')
  }
}
