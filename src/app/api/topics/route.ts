import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('trending_topics')
    .select('*')
    .order('score', { ascending: false })
    .limit(12)

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }

  return NextResponse.json({
    success: true,
    topics: data,
  })
}