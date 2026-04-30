import { importSources } from '@/lib/rss/importSources'

export async function GET() {
  await importSources()

  return Response.json({
    success: true,
    message: 'Import RSS completato',
  })
}