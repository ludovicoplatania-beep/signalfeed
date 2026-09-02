import { NextResponse } from 'next/server'
import { apiError } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    const { data, error } = await getServiceSupabase()
      .from('trending_topics')
      .select('*')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(12)
    if (error) throw error
    return NextResponse.json({ success: true, topics: data })
  } catch (error) {
    return apiError(error, 'Errore caricamento topic')
  }
}
