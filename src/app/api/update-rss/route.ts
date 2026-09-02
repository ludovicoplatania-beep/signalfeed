import { NextResponse } from 'next/server'
import { importSources } from '@/lib/rss/importSources'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireUser } from '@/lib/server/auth'

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    enforceRateLimit(`rss:${user.id}`, 3, 10 * 60 * 1000)
    const results = await importSources(user.id)
    return NextResponse.json({ success: true, results })
  } catch (error) {
    return apiError(error, 'Errore import RSS')
  }
}
