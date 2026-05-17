import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { importSources } from '@/lib/rss/importSources'
import { pickArticles } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'
import { updateInterestProfile } from '@/lib/ai/updateInterestProfile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST() {
  try {
    await importSources()
    await pickArticles()
    await generateTopics()

    const { data: users } = await supabase
      .from('sources')
      .select('user_id')

    const userIds = Array.from(
      new Set((users ?? []).map((row: any) => row.user_id).filter(Boolean))
    )

    for (const userId of userIds) {
      await updateInterestProfile(userId)
    }

    return NextResponse.json({
      success: true,
      message: 'Aggiornamento completato',
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Errore durante aggiornamento',
      },
      { status: 500 }
    )
  }
}