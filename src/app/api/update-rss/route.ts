import { NextResponse } from 'next/server'
import { importSources } from '@/lib/rss/importSources'

export async function POST() {
  try {
    await importSources()

    return NextResponse.json({
      success: true,
      message: 'RSS import completato',
    })
  } catch (error) {
    console.error('update-rss error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore import RSS',
      },
      { status: 500 }
    )
  }
}