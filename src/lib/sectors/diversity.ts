import { automaticPicks, categoryFor, sameStory, type Candidate, type RankedPick } from '@/lib/ai/ranking'
import { preferenceAdjustment, type Feedback } from '@/lib/ai/preferences'

/** Count editorial sites, not feed IDs or corporate ownership groups. */
export function publisherKey(url: string, name = '') {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    if (host.endsWith('.google')) return 'google'
    const labels = host.split('.')
    const suffix = labels.slice(-2).join('.')
    const compound = /^(co|com|org|net|gov|ac)\.(uk|au|jp|nz|za|br|in)$/.test(suffix)
    return labels.slice(compound ? -3 : -2).join('.')
  } catch {
    return name.toLowerCase().split(/\s*[·|]\s*/)[0].trim()
  }
}
export function sameSectorEvent(left: Candidate, right: Candidate) {
  if (sameStory(left,right)) return true
  // A specific product revision can have very different editorial headlines.
  if (!/\bDGX\s+Spark\b/i.test(left.title) || !/\bDGX\s+Spark\b/i.test(right.title)) return false
  const memory = (title: string) => title.match(/\b(\d+)\s*GB\b/i)?.[1]
  const dates = [left.published_at,right.published_at].map(date=>date ? Date.parse(date) : NaN)
  return Boolean(memory(left.title)) && memory(left.title) === memory(right.title) && dates.every(Number.isFinite) && Math.abs(dates[0]-dates[1]) <= 48 * 3_600_000
}

export type SectorCandidate = Candidate & { publisher_key: string; sector_relevance?: number }
export type Diversity = { selectedPublishers: number; availablePublishers: number; attainablePublishers: number; targetPublishers: number; selectedArticles: number; eligibleArticles: number; windowDays: number }
export const promotionalHeadline = /\b(codice sconto|coupon|sponsored|sponsorizzat\w*|in offerta|offerte amazon|sconto|sconti|compra ora|buy now)\b|^\s*\(PR\)/i

export function eligibleSectorArticles(articles: SectorCandidate[], read: Set<string>, feedback: Feedback[], windowDays: number) {
  const fresh = articles.filter(article => {
    const date = article.published_at ? Date.parse(article.published_at) : NaN
    return Number.isFinite(date) && date <= Date.now() && date >= Date.now() - windowDays * 86_400_000 &&
      !promotionalHeadline.test(article.title) && preferenceAdjustment(article, feedback) >= 0
  })
  const unread = fresh.filter(article => !read.has(article.id))
  // Do not bring read stories back merely to increase publisher variety.
  return unread.length ? unread : fresh
}

export function selectSectorPicks(proposed: RankedPick[], articles: SectorCandidate[], interests: Array<{topic: string; score: number}>, read: Set<string>, feedback: Feedback[], windowDays: number, limit = 10) {
  const automatic = automaticPicks(articles, interests, read, feedback)
  const byId = new Map(articles.map(article => [article.id, article]))
  const model = new Map(proposed.map(pick => [pick.id, pick]))
  const ranked = automatic.map(fallback => {
    const ai = model.get(fallback.id)
    const subjectWeight = byId.get(fallback.id)!.sector_relevance
    const adjustment = subjectWeight === undefined ? 0 : subjectWeight - 12
    const score = Math.max(1,Math.min(99, Math.round(ai ? ai.score * 0.4 + fallback.score * 0.6 : fallback.score) + adjustment))
    return ai ? { ...ai, category: categoryFor(byId.get(ai.id)!), score } : { ...fallback, score }
  }).sort((a,b) => b.score - a.score || a.id.localeCompare(b.id))
  const groups: RankedPick[][] = []
  for (const pick of ranked) {
    const matches = groups.flatMap((entries, index) => entries.some(entry => sameSectorEvent(byId.get(pick.id)!, byId.get(entry.id)!)) ? [index] : [])
    if (!matches.length) groups.push([pick])
    else {
      const group = groups[matches[0]]
      group.push(pick, ...matches.slice(1).flatMap(index => groups[index]))
      group.sort((a,b) => b.score - a.score || a.id.localeCompare(b.id))
      for (const index of matches.slice(1).reverse()) groups.splice(index,1)
    }
  }
  const publishers = [...new Set(ranked.map(pick => byId.get(pick.id)!.publisher_key))]
  // Match publishers to distinct events. A rare publisher covering the top event
  // can displace its first representative to another event rather than being lost.
  function matching(stop: number) {
    const occupied = new Map<number, {publisher: string; pick: RankedPick}>()
    function assign(publisher: string, visited: Set<number>): boolean {
      for (let i = 0; i < groups.length; i++) {
        const pick = groups[i].find(entry => byId.get(entry.id)!.publisher_key === publisher)
        if (!pick || visited.has(i)) continue
        visited.add(i)
        const current = occupied.get(i)
        if (!current || assign(current.publisher, visited)) { occupied.set(i,{publisher,pick}); return true }
      }
      return false
    }
    for (const publisher of publishers) {
      assign(publisher,new Set())
      if (occupied.size >= stop) break
    }
    return occupied
  }
  const attainable = matching(limit).size
  const target = Math.min(5, limit, attainable)
  const selected = [...matching(target).values()].map(entry => entry.pick)
  const counts = new Map<string,number>()
  for (const pick of selected) {
    const key = byId.get(pick.id)!.publisher_key
    counts.set(key,(counts.get(key) ?? 0) + 1)
  }
  for (const cap of [2, Infinity]) for (const pick of ranked) {
    if (selected.length >= limit) break
    const article = byId.get(pick.id)!
    if ((counts.get(article.publisher_key) ?? 0) >= cap || selected.some(entry => entry.id === pick.id || sameSectorEvent(article, byId.get(entry.id)!))) continue
    selected.push(pick); counts.set(article.publisher_key,(counts.get(article.publisher_key) ?? 0) + 1)
  }
  selected.sort((a,b) => b.score - a.score || a.id.localeCompare(b.id))
  return { picks: selected, diversity: { selectedPublishers: counts.size, availablePublishers: publishers.length,
    attainablePublishers: attainable, targetPublishers: target, selectedArticles: selected.length, eligibleArticles: articles.length, windowDays } satisfies Diversity }
}
