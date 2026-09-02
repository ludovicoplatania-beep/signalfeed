import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireUser } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'

const eventSchema = z.object({
  event_type: z.enum(['article_saved', 'article_unsaved', 'article_opened', 'topic_opened']),
  article_id: z.string().uuid().optional(),
  topic_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.union([z.string().max(500), z.number(), z.boolean(), z.null()]))
    .optional(),
}).strict()

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    enforceRateLimit(`track:${user.id}`, 60, 60_000)
    const event = eventSchema.parse(await request.json())

    const { error } = await getServiceSupabase().from('user_events').insert({
      user_id: user.id,
      event_type: event.event_type,
      article_id: event.article_id ?? null,
      topic_id: event.topic_id ?? null,
      metadata: event.metadata ?? null,
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Evento non valido' }, { status: 400 })
    }
    return apiError(error, 'Errore tracking')
  }
}
