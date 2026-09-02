import 'server-only'
import { importSources } from '@/lib/rss/importSources'
import { updateInterestProfile } from '@/lib/ai/updateInterestProfile'
import { pickArticles } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'
import { generateDigest } from '@/lib/ai/generateDigest'
import { getServiceSupabase } from './clients'

export async function updateUser(userId: string) {
  const rss = await importSources(userId)
  await updateInterestProfile(userId)
  await pickArticles(userId)
  await generateTopics(userId)
  await generateDigest(userId)
  return { rss }
}

export async function updateAllUsers() {
  await importSources()
  const { data, error } = await getServiceSupabase().from('sources').select('user_id')
  if (error) throw error

  const userIds = Array.from(new Set(
    (data ?? []).map((row: { user_id: string | null }) => row.user_id).filter(
      (id): id is string => Boolean(id),
    ),
  ))

  const results = []
  for (const userId of userIds) {
    try {
      await updateInterestProfile(userId)
      await pickArticles(userId)
      await generateTopics(userId)
      await generateDigest(userId)
      results.push({ userId, success: true })
    } catch (error) {
      console.error('User pipeline failed:', userId, error)
      results.push({ userId, success: false })
    }
  }
  return results
}
