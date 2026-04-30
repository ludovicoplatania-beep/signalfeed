import { pickArticles } from '@/lib/ai/pickArticles'

export async function GET() {
  await pickArticles()

  return Response.json({
    success: true,
    message: 'AI Picks completato',
  })
}