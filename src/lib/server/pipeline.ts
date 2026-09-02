import 'server-only'
import { importSources } from '@/lib/rss/importSources'
import { updateInterestProfile } from '@/lib/ai/updateInterestProfile'
import { pickArticles } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'
import { generateDigest } from '@/lib/ai/generateDigest'

export async function updateUser(userId: string) {
  const startedAt = new Date().toISOString()
  const rss = await importSources(userId)
  await updateInterestProfile(userId)
  await pickArticles(userId)
  await generateTopics(userId)
  await generateDigest(userId)
  return {
    rss,
    summary: {
      startedAt,
      completedAt: new Date().toISOString(),
      sourcesChecked: rss.length,
      sourcesOk: rss.filter((item) => item.success).length,
      sourcesFailed: rss.filter((item) => !item.success).length,
      itemsProcessed: rss.reduce((total, item) => total + ('count' in item ? (item.count ?? 0) : 0), 0),
    },
  }
}
