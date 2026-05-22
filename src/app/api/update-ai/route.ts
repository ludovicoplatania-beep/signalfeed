import { NextResponse } from 'next/server'
import { pickArticles } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'

export async function POST() {
  try {
    await pickArticles()
    await generateTopics()

    return NextResponse.json({
      success: true,
      message: 'AI ranking e topic completati',
    })
  } catch (error) {
    console.error('update-ai error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore aggiornamento AI',
      },
      { status: 500 }
    )
  }
}