import { NextResponse } from 'next/server'
import { importSources } from '@/lib/rss/importSources'
import { pickArticles } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({
      success: false,
      message: 'Non autorizzato',
    })
  }

  await importSources()
  await pickArticles()
  await generateTopics()

  return NextResponse.json({
    success: true,
    message: 'Aggiornamento completato: RSS + Scelte AI + Trending Topics',
  })
}