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

function hoursSince(date?: string | null) {
  if (!date) return 999
  return Math.max(
    0,
    (Date.now() - new Date(date).getTime()) / 1000 / 60 / 60
  )
}

function recencyScore(date?: string | null) {
  const hours = hoursSince(date)

  if (hours <= 6) return 100
  if (hours <= 24) return 85
  if (hours <= 72) return 65
  if (hours <= 168) return 45

  return 20
}

function getEventWeight(eventType: string) {
  if (eventType === 'article_saved') return 5
  if (eventType === 'article_opened') return 2
  if (eventType === 'topic_opened') return 3
  if (eventType === 'article_unsaved') return -4

  return 1
}

function safeSourceName(article: any) {
  return Array.isArray(article.sources)
    ? article.sources[0]?.name
    : article.sources?.name
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
    .limit(120)

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

    const [{ data: profile }, { data: events }] = await Promise.all([
      supabase
        .from('user_interests')
        .select('interests')
        .eq('user_id', userId)
        .single(),

      supabase
        .from('user_events')
        .select('event_type, article_id, topic_id, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    const eventSignals = (events ?? []).map((event: any) => ({
      event_type: event.event_type,
      weight: getEventWeight(event.event_type),
      article_id: event.article_id,
      topic_id: event.topic_id,
      metadata: event.metadata,
      hours_ago: hoursSince(event.created_at),
    }))

    const compactArticles = userArticles.map((article: any) => ({
      id: article.id,
      title: article.title,
      source: safeSourceName(article),
      excerpt: article.excerpt,
      content: article.article_content?.slice(0, 1200) ?? '',
      published_at: article.published_at,
      recency_score: recencyScore(article.published_at),
    }))

    const prompt = `
Restituisci SOLO JSON valido. Nessun markdown.

Devi selezionare i 10 articoli migliori per QUESTO utente usando ranking editoriale personalizzato.

Profilo interessi:
${JSON.stringify(profile?.interests ?? [])}

Segnali comportamentali recenti:
${JSON.stringify(eventSignals)}

Articoli disponibili:
${JSON.stringify(compactArticles)}

Formato:
{
  "picks": [
    {
      "id": "uuid articolo",
      "score": 1-100,
      "summary": "riassunto utile, massimo 220 caratteri",
      "reason": "perché merita attenzione per questo utente, massimo 180 caratteri",
      "category": "categoria specifica",
      "priority": "high|medium|low"
    }
  ]
}

Criteri obbligatori:
- usa gli interessi utente, ma non creare una bolla informativa
- applica novelty: premia temi nuovi ma coerenti
- applica diversity: evita 10 articoli sulla stessa micro-notizia
- applica recency decay: notizie vecchie devono essere scelte solo se ancora strategiche
- applica anti-clickbait: penalizza titoli rumorosi senza sostanza
- usa segnali forti: salvataggi > topic cliccati > aperture
- evita duplicati semantici
- scegli anche 1-2 articoli fuori profilo se hanno forte impatto generale
- reason deve spiegare il valore per questo specifico utente
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Rispondi sempre con JSON valido nel formato { "picks": [...] }.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.12,
    })

    let picks: any[] = []

    try {
      const raw = response.choices[0].message.content || '{}'
      const parsed = JSON.parse(raw)
      picks = parsed.picks || []
    } catch {
      continue
    }

    await supabase
      .from('ai_picks')
      .delete()
      .eq('user_id', userId)

    const usedSources = new Set<string>()
    const usedCategories = new Set<string>()

    for (const pick of picks) {
      const article = userArticles.find((article: any) => article.id === pick.id)
      if (!article) continue

      const sourceName = safeSourceName(article) ?? 'unknown'
      const category = pick.category ?? 'Generale'

      const tooMuchSource = usedSources.has(sourceName) && usedSources.size < 4
      const tooMuchCategory = usedCategories.has(category) && usedCategories.size < 4

      if (tooMuchSource && tooMuchCategory) continue

      await supabase.from('ai_picks').insert({
        user_id: userId,
        article_id: pick.id,
        score: pick.score,
        summary: pick.summary,
        reason: pick.reason,
        category,
      })

      usedSources.add(sourceName)
      usedCategories.add(category)

      if (usedSources.size >= 10 || usedCategories.size >= 10) break
    }
  }
}