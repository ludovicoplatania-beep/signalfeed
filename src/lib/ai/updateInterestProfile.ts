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
Restituisci SOLO JSON valido.

Analizza comportamento utente.

Capisci:
- temi preferiti
- categorie ricorrenti
- interessi strategici
- pattern cognitivi
- fonti preferite

Formato:
[
  {
    "topic": "AI geopolitica",
    "score": 92
  }
]

Massimo 15 interessi.
Score 1-100.
Niente categorie generiche tipo "tech".

Eventi:
${JSON.stringify(events)}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })

  let interests = []

  try {
    interests = JSON.parse(
      response.choices[0].message.content || '[]'
    )
  } catch {
    return
  }

  await supabase
    .from('user_interests')
    .upsert({
      user_id: userId,
      interests,
      updated_at: new Date().toISOString(),
    })
}