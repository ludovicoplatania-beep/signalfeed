import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function pickArticles() {
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      excerpt,
      published_at,
      sources (
        name,
        user_id
      )
    `)
    .order('published_at', { ascending: false })
    .limit(25)

  if (!articles || articles.length === 0) return

  const prompt = `
Restituisci SOLO JSON valido.
Non usare markdown.
Non usare blocchi di codice.

Scegli i 10 articoli migliori tra questi.
Evita gossip, duplicati e clickbait.

Formato esatto:
[
  {
    "id": "uuid articolo",
    "score": 90,
    "summary": "riassunto breve",
    "reason": "motivo della scelta",
    "category": "categoria"
  }
]

Articoli:
${JSON.stringify(articles)}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })

  const text = response.choices[0].message.content || '[]'

  let picks: any[] = []

  try {
    picks = JSON.parse(text)
  } catch {
    console.log('JSON non valido:', text)
    return
  }

  for (const pick of picks) {
    const article: any = articles.find((a: any) => a.id === pick.id)
    const sourceData: any = article?.sources

    const userId = Array.isArray(sourceData)
      ? sourceData[0]?.user_id
      : sourceData?.user_id

    if (!userId) continue

    const { error } = await supabase.from('ai_picks').upsert({
      user_id: userId,
      article_id: pick.id,
      score: pick.score,
      summary: pick.summary,
      reason: pick.reason,
      category: pick.category,
    })

    if (error) {
      console.log('Errore salvataggio pick:', error.message)
    }
  }
}