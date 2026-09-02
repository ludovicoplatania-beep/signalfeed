import 'server-only'
import OpenAI from 'openai'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getServerEnv } from './env'

let serviceClient: SupabaseClient | undefined
let openAIClient: OpenAI | undefined

export function getServiceSupabase(): SupabaseClient {
  if (!serviceClient) {
    const env = getServerEnv()
    serviceClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return serviceClient
}

export function getOpenAI(): OpenAI {
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey: getServerEnv().OPENAI_API_KEY })
  }

  return openAIClient
}
