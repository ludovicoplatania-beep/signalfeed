import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function generateTopics() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      excerpt,
      published_at,
      sources ( name )
    `)
    .order('published_at', { ascending: false })
    .limit(60)

  if (error) {
    console.log('Errore caricamento articoli topics:', error.message)
    return
  }

  if (!articles || articles.length === 0) return

  const prompt = `
Restituisci SOLO JSON valido.
Non usare markdown.
Non usare blocchi di codice.

Analizza questi articoli e individua massimo 8 temi ricorrenti/trending.

Formato esatto:
[
  {
    "title": "nome breve del tema",
    "description": "spiegazione sintetica del perché è rilevante",
    "score": 90,
    "articles": ["id articolo 1", "id articolo 2"]
  }
]

Regole:
- score da 1 a 100
- title massimo 4 parole
- description massimo 180 caratteri
- articles deve contenere gli id degli articoli collegati
- evita temi generici tipo "notizie", "attualità", "mondo"

Articoli:
${JSON.stringify(articles)}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })

  const text = response.choices[0].message.content || '[]'

  let topics: any[] = []

  try {
    topics = JSON.parse(text)
  } catch {
    console.log('JSON topics non valido:', text)
    return
  }

  await supabase.from('trending_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  for (const topic of topics) {
    const { error: insertError } = await supabase.from('trending_topics').insert({
      title: topic.title,
      description: topic.description,
      score: topic.score,
      articles: topic.articles,
    })

    if (insertError) {
      console.log('Errore salvataggio topic:', insertError.message)
    }
  }
}