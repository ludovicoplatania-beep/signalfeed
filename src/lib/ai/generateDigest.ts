import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function generateDigest(userId: string) {
  const [{ data: picks }, { data: interests }] = await Promise.all([
    supabase
      .from('ai_picks')
      .select(`
        score,
        summary,
        reason,
        category,
        articles (
          id,
          title,
          url,
          excerpt,
          sources ( name )
        )
      `)
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(10),

    supabase
      .from('user_interests')
      .select('interests')
      .eq('user_id', userId)
      .single(),
  ])

  if (!picks?.length) return

  const prompt = `
Restituisci SOLO JSON valido.

Crea un digest giornaliero personalizzato per questo utente.

Profilo interessi:
${JSON.stringify(interests?.interests ?? [])}

Articoli selezionati:
${JSON.stringify(picks)}

Formato:
{
  "title": "titolo breve del digest",
  "summary": "sintesi editoriale complessiva, massimo 900 caratteri",
  "key_points": [
    "punto chiave 1",
    "punto chiave 2",
    "punto chiave 3"
  ],
  "recommended_articles": [
    {
      "id": "article id",
      "title": "titolo articolo",
      "reason": "perché leggerlo"
    }
  ]
}

Regole:
- massimo 5 key_points
- massimo 6 articoli consigliati
- tono: asciutto, analitico, utile
- niente frasi motivazionali
- evidenzia cosa conta davvero
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Rispondi sempre con JSON valido.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
  })

  const parsed = JSON.parse(response.choices[0].message.content || '{}')

  await supabase.from('daily_digests').insert({
    user_id: userId,
    title: parsed.title ?? 'Digest giornaliero',
    summary: parsed.summary ?? '',
    key_points: parsed.key_points ?? [],
    recommended_articles: parsed.recommended_articles ?? [],
  })
}