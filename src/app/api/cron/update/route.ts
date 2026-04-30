import { importSources } from '@/lib/rss/importSources'
import { pickArticles } from '@/lib/ai/pickArticles'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return Response.json(
      {
        success: false,
        message: 'Non autorizzato',
      },
      { status: 401 }
    )
  }

  await importSources()
  await pickArticles()

  return Response.json({
    success: true,
    message: 'Aggiornamento completato: RSS + Scelte da ChatGPT',
  })
}