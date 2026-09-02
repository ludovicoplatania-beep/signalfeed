import { NextResponse } from 'next/server'
import { updateInterestProfile } from '@/lib/ai/updateInterestProfile'
import { generateDigest } from '@/lib/ai/generateDigest'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireOwner } from '@/lib/server/auth'

export async function POST(request: Request) {
  try {
    const user = await requireOwner(request)
    enforceRateLimit(`profile:${user.id}`, 3, 10 * 60 * 1000)
    await updateInterestProfile(user.id)
    await generateDigest(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'Errore profilo interessi')
  }
}
