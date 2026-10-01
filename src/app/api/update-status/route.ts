import { NextResponse } from 'next/server'
import { apiError } from '@/lib/server/api'
import { requireOwner } from '@/lib/server/auth'
import { getUpdate } from '@/lib/server/pipeline'

export async function GET(request: Request) {
  try {
    const owner = await requireOwner(request)
    return NextResponse.json({ success: true, job: await getUpdate(owner.id) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, 'Impossibile verificare aggiornamento')
  }
}
