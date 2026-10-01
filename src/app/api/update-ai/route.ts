import { apiError } from '@/lib/server/api'
import { requireOwner } from '@/lib/server/auth'
import { enqueueUpdate } from '@/lib/server/updateResponse'

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request)
    return await enqueueUpdate(owner.id, 'ai')
  } catch (error) {
    return apiError(error, 'Impossibile avviare aggiornamento')
  }
}
