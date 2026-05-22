import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateInterestProfile } from '@/lib/ai/updateInterestProfile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST() {
  try {
    const { data: users } = await supabase
      .from('sources')
      .select('user_id')

    const userIds = Array.from(
      new Set((users ?? []).map((row: any) => row.user_id).filter(Boolean))
    )

    for (const userId of userIds) {
      await updateInterestProfile(userId)
    }

    return NextResponse.json({
      success: true,
      message: 'Profilo interessi aggiornato',
    })
  } catch (error) {
    console.error('update-profile error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Errore profilo interessi',
      },
      { status: 500 }
    )
  }
}