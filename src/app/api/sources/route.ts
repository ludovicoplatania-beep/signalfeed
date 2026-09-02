import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/server/api'
import { enforceRateLimit, requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'
import { assertSafePublicUrl } from '@/lib/server/safeFetch'

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  website_url: z.string().url().max(2_000).nullable(),
  rss_url: z.string().url().max(2_000),
  priority: z.number().int().min(1).max(5),
}).strict()

const updateSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
}).strict()

const deleteSchema = z.object({ id: z.string().uuid() }).strict()

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request)
    enforceRateLimit(`sources:create:${owner.id}`, 10, 60 * 60 * 1000)
    const source = createSchema.parse(await request.json())
    await assertSafePublicUrl(source.rss_url)
    if (source.website_url) await assertSafePublicUrl(source.website_url)

    const { error } = await getServiceSupabase().from('sources').insert({
      ...source,
      user_id: owner.id,
      is_active: true,
    })
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Fonte non valida' }, { status: 400 })
    }
    return apiError(error, 'Errore salvataggio fonte')
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireOwner(request)
    const update = updateSchema.parse(await request.json())
    const { error } = await getServiceSupabase().from('sources')
      .update({ is_active: update.is_active })
      .eq('id', update.id)
      .eq('user_id', owner.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Aggiornamento non valido' }, { status: 400 })
    }
    return apiError(error, 'Errore aggiornamento fonte')
  }
}

export async function DELETE(request: Request) {
  try {
    const owner = await requireOwner(request)
    const { id } = deleteSchema.parse(await request.json())
    const { error } = await getServiceSupabase().from('sources')
      .delete()
      .eq('id', id)
      .eq('user_id', owner.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Eliminazione non valida' }, { status: 400 })
    }
    return apiError(error, 'Errore eliminazione fonte')
  }
}
