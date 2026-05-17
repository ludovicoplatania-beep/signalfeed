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
      article_content,
      published_at,
      sources ( name )
    `)
    .order('published_at', { ascending: false })
    .limit(80)

  if (error || !articles?.length) return

  const compactArticles = articles.map((article: any) => ({
    id: article.id,
    title: article.title,
    source: Array.isArray(article.sources)
      ? article.sources[0]?.name
      : article.sources?.name,
    excerpt: article.excerpt,
    content: article.article_content?.slice(0, 1200) ?? '',
    published_at: article.published_at,
  }))

  const prompt = `
Restituisci SOLO JSON valido. Nessun markdown.

Devi creare cluster tematici intelligenti dagli articoli.
Non limitarti a keyword. Raggruppa notizie che parlano dello stesso fenomeno, anche se usano parole diverse.

Formato:
[
  {
    "title": "massimo 4 parole",
    "description": "perché questo tema è rilevante, massimo 220 caratteri",
    "score": 1-100,
    "articles": ["id1", "id2"],
    "angle": "lettura interpretativa del tema, massimo 160 caratteri"
  }
]

Regole:
- massimo 8 topic
- ogni topic deve avere almeno 2 articoli se possibile
- niente topic generici tipo "Politica", "Tecnologia", "Notizie"
- preferisci fenomeni specifici: "Crisi chip AI", "Guerra commerciale USA-Cina", "Energia nucleare europea"
- score alto se il tema è ricorrente, urgente o strategico
- evita duplicati semantici tra topic
- usa solo id realmente presenti

Articoli:
${JSON.stringify(compactArticles)}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.15,
  })

  let topics: any[] = []

  try {
    topics = JSON.parse(response.choices[0].message.content || '[]')
  } catch {
    return
  }

  await supabase
    .from('trending_topics')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  for (const topic of topics) {
    await supabase.from('trending_topics').insert({
      title: topic.title,
      description: topic.angle
        ? `${topic.description} ${topic.angle}`
        : topic.description,
      score: topic.score,
      articles: topic.articles,
    })
  }
}