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
    .limit(80)

  if (error || !articles?.length) return

  const userIds = Array.from(
    new Set(
      articles
        .map((article: any) => getUserId(article))
        .filter(Boolean)
    )
  )

  for (const userId of userIds) {
    const userArticles = articles.filter(
      (article: any) => getUserId(article) === userId
    )

    const { data: profile } = await supabase
      .from('user_interests')
      .select('interests')
      .eq('user_id', userId)
      .single()

    const compactArticles = userArticles.map((article: any) => ({
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

Scegli i 10 articoli migliori per QUESTO utente.

Profilo interessi utente:
${JSON.stringify(profile?.interests ?? [])}

Articoli disponibili:
${JSON.stringify(compactArticles)}

Formato:
[
  {
    "id": "uuid articolo",
    "score": 1-100,
    "summary": "riassunto utile, massimo 220 caratteri",
    "reason": "perché merita attenzione per questo utente, massimo 180 caratteri",
    "category": "categoria specifica",
    "priority": "high|medium|low"
  }
]

Criteri:
- usa il profilo interessi, ma non diventare cieco: segnala anche notizie importanti fuori profilo
- aumenta score se articolo combacia con interessi forti
- penalizza contenuti deboli, gossip, duplicati, clickbait
- diversifica fonti e categorie
- preferisci articoli con sostanza e impatto futuro
- non scegliere più articoli sullo stesso micro-tema se non necessario
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Rispondi sempre con JSON valido. Se devi restituire una lista, usa la chiave "picks".',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.15,
    })

    let picks: any[] = []

    try {
      const raw = response.choices[0].message.content || '{}'
      const parsed = JSON.parse(raw)

      picks = Array.isArray(parsed)
        ? parsed
        : parsed.picks || []
    } catch {
      continue
    }

    await supabase
      .from('ai_picks')
      .delete()
      .eq('user_id', userId)

    for (const pick of picks.slice(0, 10)) {
      await supabase.from('ai_picks').insert({
        user_id: userId,
        article_id: pick.id,
        score: pick.score,
        summary: pick.summary,
        reason: pick.reason,
        category: pick.category,
      })
    }
  }
}