import { NextResponse } from 'next/server'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireUser } from '@/lib/server/auth'
import { updateUser } from '@/lib/server/pipeline'

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    enforceRateLimit(`update:${user.id}`, 2, 10 * 60 * 1000)
    const result = await updateUser(user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return apiError(error, 'Errore durante aggiornamento pipeline')
  }
}
