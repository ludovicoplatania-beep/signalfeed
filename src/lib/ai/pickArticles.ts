import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function getUserId(article: any) {
  return Array.isArray(article?.sources)
    ? article.sources[0]?.user_id
    : article?.sources?.user_id
}

export async function pickArticles() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      excerpt,
      article_content,
      published_at,
      sources (
        name,
        user_id
      )
    `)
    .order('published_at', { ascending: false })
    .limit(50)

  if (error || !articles?.length) return

  const compactArticles = articles.map((article: any) => ({
    id: article.id,
    title: article.title,
    source: Array.isArray(article.sources)
      ? article.sources[0]?.name
      : article.sources?.name,
    excerpt: article.excerpt,
    content: article.article_content?.slice(0, 1000) ?? '',
    published_at: article.published_at,
  }))

  const prompt = `
Restituisci SOLO JSON valido. Nessun markdown.

Scegli i 10 articoli migliori.
Non scegliere semplicemente i più recenti.
Devi fare ranking editoriale intelligente.

Formato:
[
  {
    "id": "uuid articolo",
    "score": 1-100,
    "summary": "riassunto utile, massimo 220 caratteri",
    "reason": "perché merita attenzione, massimo 180 caratteri",
    "category": "categoria specifica",
    "priority": "high|medium|low"
  }
]

Criteri:
- rilevanza strategica
- impatto futuro
- originalità
- qualità informativa
- evita duplicati semantici
- penalizza gossip, clickbait, articoli deboli
- diversifica fonti e categorie
- preferisci contenuti con sostanza rispetto a titoli sensazionalistici

Articoli:
${JSON.stringify(compactArticles)}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.15,
  })

  let picks: any[] = []

  try {
    picks = JSON.parse(response.choices[0].message.content || '[]')
  } catch {
    return
  }

  for (const pick of picks) {
    const article = articles.find((a: any) => a.id === pick.id)
    const userId = getUserId(article)

    if (!userId) continue

    await supabase.from('ai_picks').upsert({
      user_id: userId,
      article_id: pick.id,
      score: pick.score,
      summary: pick.summary,
      reason: pick.reason,
      category: pick.category,
    })
  }
}