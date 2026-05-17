import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function updateInterestProfile(userId: string) {
  const { data: events } = await supabase
    .from('user_events')
    .select(`
      event_type,
      metadata,
      article_id
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(120)

  if (!events?.length) return

  const prompt = `
Restituisci ESCLUSIVAMENTE JSON valido.
Nessun markdown.
Nessun testo extra.

Formato:
[
  {
    "topic": "AI geopolitica",
    "score": 92
  }
]

Massimo 15 interessi.

Analizza questi eventi utente e deduci:
- temi ricorrenti
- interessi cognitivi
- argomenti strategici preferiti
- pattern editoriali

Eventi:
${JSON.stringify(events)}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Rispondi sempre con JSON valido. Nessun markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    })

    const raw = response.choices[0].message.content || '{}'

    const parsed = JSON.parse(raw)

    const interests = Array.isArray(parsed)
      ? parsed
      : parsed.interests || []

    if (!Array.isArray(interests)) return

    await supabase
      .from('user_interests')
      .upsert({
        user_id: userId,
        interests,
        updated_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('Interest profiling error:', error)
  }
}