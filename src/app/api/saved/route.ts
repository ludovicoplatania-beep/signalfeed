import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/server/api'
import { requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'

const articleSchema = z.object({ article_id: z.string().uuid() }).strict()

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request)
    const { article_id } = articleSchema.parse(await request.json())
    const supabase = getServiceSupabase()
    const { data: article } = await supabase.from('articles')
      .select('id, sources!inner(user_id)')
      .eq('id', article_id)
      .eq('sources.user_id', owner.id)
      .maybeSingle()
    if (!article) {
      return NextResponse.json({ success: false, message: 'Articolo non trovato' }, { status: 404 })
    }

    const { error } = await supabase.from('saved_articles').upsert(
      { user_id: owner.id, article_id },
      { onConflict: 'user_id,article_id' },
    )
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Articolo non valido' }, { status: 400 })
    }
    return apiError(error, 'Errore salvataggio articolo')
  }
}

export async function DELETE(request: Request) {
  try {
    const owner = await requireOwner(request)
    const { article_id } = articleSchema.parse(await request.json())
    const { error } = await getServiceSupabase().from('saved_articles')
      .delete()
      .eq('user_id', owner.id)
      .eq('article_id', article_id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Articolo non valido' }, { status: 400 })
    }
    return apiError(error, 'Errore rimozione articolo')
  }
}
