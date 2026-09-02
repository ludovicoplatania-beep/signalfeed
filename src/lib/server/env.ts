import 'server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
  OPENAI_API_KEY: z.string().min(20),
  CRON_SECRET: z.string().min(32),
  APP_PASSWORD: z.string().min(12),
  APP_SESSION_SECRET: z.string().min(32),
  OWNER_USER_ID: z.string().uuid(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cachedEnv: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = serverEnvSchema.parse(process.env)
  }

  return cachedEnv
}
