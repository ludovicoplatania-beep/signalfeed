import { NextResponse } from 'next/server'
import { importSources } from '@/lib/rss/importSources'
import { pickArticles } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'

export async function POST() {
  try {
    await importSources()
    await pickArticles()
    await generateTopics()

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