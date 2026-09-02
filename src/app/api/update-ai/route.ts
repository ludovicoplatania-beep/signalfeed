import { NextResponse } from 'next/server'
import { pickArticles } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireUser } from '@/lib/server/auth'

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    enforceRateLimit(`ai:${user.id}`, 3, 10 * 60 * 1000)
    await pickArticles(user.id)
    await generateTopics(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'Errore aggiornamento AI')
  }
}
