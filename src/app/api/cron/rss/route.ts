import { requireCron } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { getServerEnv } from '@/lib/server/env'
import { NextResponse } from 'next/server'
import { getUpdate } from '@/lib/server/pipeline'
import { enqueueUpdate } from '@/lib/server/updateResponse'

export const maxDuration = 300

export async function GET(request: Request) {
  try {
    requireCron(request)
    const owner = getServerEnv().OWNER_USER_ID
    if (new URL(request.url).searchParams.get('status') === '1') {
      return NextResponse.json({ success: true, job: await getUpdate(owner) }, { headers: { 'Cache-Control': 'private, no-store' } })
    }
    return await enqueueUpdate(owner, 'rss', { dueSourcesOnly: true })
  } catch (error) {
    return apiError(error, 'Errore importazione programmata')
  }
}
