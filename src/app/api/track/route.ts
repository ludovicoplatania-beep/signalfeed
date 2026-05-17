import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { user_id, event_type, article_id, topic_id, metadata } = body

    if (!user_id || !event_type) {
      return NextResponse.json(
        { success: false, message: 'Dati mancanti' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('user_events').insert({
      user_id,
      event_type,
      article_id: article_id || null,
      topic_id: topic_id || null,
      metadata: metadata || null,
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Errore tracking' },
      { status: 500 }
    )
  }
}