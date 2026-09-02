import { NextResponse } from 'next/server'
import { requireCron, enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { updateUser } from '@/lib/server/pipeline'
import { getServerEnv } from '@/lib/server/env'

export async function GET(request: Request) {
  try {
    requireCron(request)
    enforceRateLimit('cron:update', 2, 60 * 60 * 1000)
    const result = await updateUser(getServerEnv().OWNER_USER_ID)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    return apiError(error, 'Errore aggiornamento programmato')
  }
}
