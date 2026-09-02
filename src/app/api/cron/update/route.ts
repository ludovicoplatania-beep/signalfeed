import { NextResponse } from 'next/server'
import { requireCron, enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { updateAllUsers } from '@/lib/server/pipeline'

export async function GET(request: Request) {
  try {
    requireCron(request)
    enforceRateLimit('cron:update', 2, 60 * 60 * 1000)
    const results = await updateAllUsers()
    return NextResponse.json({ success: true, results })
  } catch (error) {
    return apiError(error, 'Errore aggiornamento programmato')
  }
}
