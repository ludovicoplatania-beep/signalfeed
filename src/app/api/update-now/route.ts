import { NextResponse } from 'next/server'

async function callInternal(path: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`

  if (!baseUrl) {
    throw new Error('Missing site URL')
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`${path} failed`)
  }

  return response.json()
}

export async function POST() {
  try {
    await callInternal('/api/update-rss')
    await callInternal('/api/update-ai')
    await callInternal('/api/update-profile')

    return NextResponse.json({
      success: true,
      message: 'Aggiornamento completato',
    })
  } catch (error) {
    console.error('update-now pipeline error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore durante aggiornamento pipeline',
      },
      { status: 500 }
    )
  }
}