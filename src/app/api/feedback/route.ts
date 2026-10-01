import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'

const schema = z.object({ article_id: z.uuid(), preference: z.enum(['like', 'less_topic', 'less_source']).nullable() }).strict()

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request)
    enforceRateLimit(`feedback:${owner.id}`, 60)
    const body = schema.parse(await request.json())
    const { data, error } = await getServiceSupabase().rpc('athena_set_feedback', {
      p_user: owner.id, p_article: body.article_id, p_preference: body.preference,
    })
    if (error) throw error
    return NextResponse.json({ success: true, article_id: data, preference: body.preference }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, message: 'Preferenza non valida' }, { status: 400 })
    return apiError(error, 'Preferenza non salvata')
  }
}
