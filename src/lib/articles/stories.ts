import { canonicalArticleUrl } from './identity'
import { meaningfulTokens } from '@/lib/ai/preferences'

export type StoryArticle = { id: string; title: string; url: string; published_at: string | null; sources: { name: string } | null }

export function sameEvent(left: StoryArticle, right: StoryArticle) {
  try { if (canonicalArticleUrl(left.url) === canonicalArticleUrl(right.url)) return true } catch { return false }
  const dates = [left.published_at, right.published_at].map(date => date ? new Date(date).getTime() : NaN)
  if (!dates.every(Number.isFinite) || Math.abs(dates[0] - dates[1]) > 48 * 3_600_000) return false
  const a = meaningfulTokens(left.title); const b = meaningfulTokens(right.title)
  if (Math.min(a.size, b.size) < 4) return false
  const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).sort().join('|')
  if (numbers(left.title) !== numbers(right.title)) return false
  const common = [...a].filter(token => b.has(token)).length
  return common >= 4 && common / (a.size + b.size - common) >= 0.7
}

/** Presentation grouping only: original articles, saves and preferences keep their IDs. */
export function groupStories<T extends StoryArticle>(articles: T[]) {
  const groups: { article: T; alternatives: T[] }[] = []
  for (const article of articles) {
    const group = groups.find(entry => sameEvent(entry.article, article))
    if (group) group.alternatives.push(article)
    else groups.push({ article, alternatives: [] })
  }
  return groups
}
