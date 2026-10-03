import { editorialAllowed, editorialBoost, type Interest } from './editorial'
import { sameEvent } from '@/lib/articles/stories'
import { canonicalArticleUrl } from '@/lib/articles/identity'
import { classifyArticle } from '@/lib/sectors/catalog'
import { preferenceAdjustment, meaningfulTokens, type Feedback } from './preferences'
import { sourceSummary } from '@/lib/articles/summary'

export const categories = ['Tecnologia', 'Intelligenza artificiale', 'Videogiochi', 'Diritto e giustizia', 'Sicilia e Catania', 'Economia', 'Politica', 'Esteri', 'Salute', 'Ambiente', 'Scienza', 'Cultura', 'Cinema e media', 'Cronaca', 'Sport', 'Generale'] as const
export type Candidate = {
  id: string; title: string; url: string; excerpt: string | null; article_content: string | null
  published_at: string | null; created_at: string; source_id: string; source_name: string; source_priority: number
}
export type RankedPick = {
  id: string; score: number; summary: string; reason: string; category: string; selection_method: 'ai' | 'automatic'
}

export function categoryFor(article: Pick<Candidate, 'title' | 'excerpt'>, proposed?: string) {
  const known = categories.find((category) => category.toLowerCase() === proposed?.trim().toLowerCase())
  const sectors = classifyArticle(article)
  const primary = [['ia', 'Intelligenza artificiale'], ['videogiochi', 'Videogiochi'], ['diritto', 'Diritto e giustizia'], ['sicilia-catania', 'Sicilia e Catania'], ['tecnologia', 'Tecnologia']]
    .find(([slug]) => sectors.includes(slug as ReturnType<typeof classifyArticle>[number]))
  if (primary) return primary[1]
  const text = `${article.title} ${article.excerpt ?? ''}`.toLowerCase()
  const rules: Array<[string, RegExp]> = [
    ['Cinema e media', /\b(film|cinema|serie tv|streaming|netflix|disney|regista|attor\w*)\b/i],
    ['Tecnologia', /\b(software|smartphone|android|iphone|google|microsoft|cyber\w*|robot\w*|app)\b/i],
    ['Economia', /\b(economia|mercati|borsa|aziend\w*|imprese|lavoro|inflazione|banch\w*)\b/i],
    ['Salute', /\b(salute|sanità|medic\w*|ospedale|virus|farmac\w*|malattia)\b/i],
    ['Ambiente', /\b(clima|ambiente|energia|incendio|alluvione|emissioni)\b/i],
    ['Politica', /\b(governo|parlamento|elezioni|ministr\w*|partito|politica)\b/i],
    ['Sport', /\b(calcio|tennis|motogp|gara|campionato|partita|atleta)\b/i],
    ['Cronaca', /\b(incidente|arrest\w*|inchiesta|morto|ferito|polizia|carabinieri)\b/i],
  ]
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? (known && !['Intelligenza artificiale', 'Videogiochi', 'Diritto e giustizia', 'Sicilia e Catania', 'Tecnologia'].includes(known) ? known : 'Generale')
}

function titleTokens(title: string) {
  return new Set(title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((word) => word.length > 2 || /^\d+$/.test(word)))
}
export function sameStory(a: Candidate, b: Candidate) {
  if (sameEvent({ ...a, sources: { name: a.source_name } }, { ...b, sources: { name: b.source_name } })) return true
  if (canonicalArticleUrl(a.url) === canonicalArticleUrl(b.url)) return true
  const left = titleTokens(a.title); const right = titleTokens(b.title)
  if ([...left].sort().join(' ') === [...right].sort().join(' ')) return true
  if (Math.min(left.size, right.size) < 6) return false
  if ([...left].filter((word) => /^\d+$/.test(word)).sort().join(' ') !== [...right].filter((word) => /^\d+$/.test(word)).sort().join(' ')) return false
  const common = [...left].filter((word) => right.has(word)).length
  return common / (left.size + right.size - common) >= 0.85
}

export function balancedCandidates(groups: Candidate[][], limit = 120) {
  const result: Candidate[] = []
  const ordered = [...groups].sort((a, b) => (b[0]?.source_priority ?? 0) - (a[0]?.source_priority ?? 0) || (a[0]?.source_id ?? '').localeCompare(b[0]?.source_id ?? ''))
  for (let index = 0; result.length < limit; index++) {
    let added = false
    for (const group of ordered) {
      if (!group[index]) continue
      if (result.some((article) => canonicalArticleUrl(article.url) === canonicalArticleUrl(group[index].url))) continue
      result.push(group[index]); added = true
      if (result.length === limit) break
    }
    if (!added && ordered.every((group) => group.length <= index + 1)) break
  }
  return result
}

export function automaticPicks(articles: Candidate[], interests: Interest[], readIds: Set<string>, feedback: Feedback[] = []) {
  return articles.map((article): RankedPick => {
    const age = article.published_at ? Math.max(0, (Date.now() - new Date(article.published_at).getTime()) / 3_600_000) : Infinity
    const freshness = age < 6 ? 45 : age < 24 ? 40 : age < 72 ? 30 : age < 168 ? 18 : 5
    const tokens = meaningfulTokens(`${article.title} ${article.excerpt ?? ''}`)
    const core = classifyArticle(article).some(slug => ['ia', 'tecnologia', 'videogiochi', 'diritto', 'sicilia-catania'].includes(slug))
    const affinity = interests.filter(i=>i.origin!=='manual').reduce((score, interest) => {
      const words = [...meaningfulTokens(interest.topic)]
      const matches = words.filter(word => tokens.has(word)).length
      return Math.max(score, matches > 0 && matches >= Math.ceil(words.length / 2) ? Math.min(20, interest.score / 5) : 0)
    }, core ? 30 : 0)
    const promotional = /\b(codice sconto|coupon|sponsored|sponsorizzato|offerta lampo|compra ora|buy now)\b/i.test(article.title)
    const preference = preferenceAdjustment(article, feedback)
    const personal = editorialBoost(article, interests)
    return { id: article.id, score: Math.max(1, Math.min(99, Math.round(freshness + affinity + personal.boost + article.source_priority * 2 + preference - (promotional ? 35 : 0) - (readIds.has(article.id) ? 25 : 0)))),
      summary: sourceSummary(article), category: categoryFor(article), selection_method: 'automatic',
      reason: `${personal.topic ? `Tema scelto da te: ${personal.topic}` : preference > 0 ? 'Vicino ai tuoi Mi piace' : preference < 0 ? 'Ridotto per la tua preferenza' : readIds.has(article.id) ? 'Approfondimento già consultato' : 'Articolo non ancora consultato'} · ${article.source_name}. Ordinato per attualità, interessi e priorità della fonte.`.slice(0, 180) }
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
}

// Reserve discovery slots when fresh, unread articles from unfamiliar publishers exist.
export function picksWithDiscovery(picks: RankedPick[], articles: Candidate[], knownSources: Set<string>, readIds: Set<string>, feedback: Feedback[] = [], limit = 10, interests: Interest[] = []) {
  const unread = articles.filter(article => !readIds.has(article.id))
  const pool = diversifyPicks(automaticPicks(unread, [], new Set(), feedback), unread, limit).length >= limit ? unread : articles
  const eligible = pool.filter(article => !feedback.some(entry => entry.article_id === article.id && entry.preference?.startsWith('less_')))
  const byId = new Map(eligible.map(article => [article.id, article]))
  const adjusted = picks.filter(pick => byId.has(pick.id)).map(pick => {
    // Calibrate model relevance against independent content/date/preference signals.
    // Automatic scores already include preference weights.
    return { ...pick, category: categoryFor(byId.get(pick.id)!), score: pick.selection_method === 'ai' ? Math.max(1, Math.min(99, Math.round(pick.score * 0.4 + (automaticPicks([byId.get(pick.id)!], interests, readIds, feedback)[0].score) * 0.6))) : pick.score }
  })
  const discovery = adjusted.filter(pick => {
    const article = byId.get(pick.id)!
    const age = article.published_at ? Date.now() - new Date(article.published_at).getTime() : Infinity
    return classifyArticle(article).some(slug => ['ia', 'tecnologia', 'videogiochi', 'diritto', 'sicilia-catania'].includes(slug)) && knownSources.size > 0 && !knownSources.has(article.source_name) && !readIds.has(article.id) && age <= 72 * 3_600_000 && preferenceAdjustment(article, feedback) >= 0
  }).sort((a, b) => b.score - a.score)
  const discoveryChoices = diversifyPicks(discovery, eligible, Math.min(2, limit))
  const available = adjusted.filter(pick => !discoveryChoices.some(discover => sameStory(byId.get(discover.id)!, byId.get(pick.id)!)))
  const preferred = available.filter(pick => preferenceAdjustment(byId.get(pick.id)!, feedback) >= 0)
  const personal = diversifyPicks(preferred, eligible, limit - discoveryChoices.length)
  if (personal.length < limit - discoveryChoices.length) {
    const fill = diversifyPicks([...personal, ...available], eligible, limit - discoveryChoices.length)
    for (const pick of fill) if (!personal.some(entry => entry.id === pick.id) && personal.length < limit - discoveryChoices.length) personal.push(pick)
  }
  return [...personal, ...discoveryChoices.map(pick => ({ ...pick, reason: `Scoperta · ${pick.reason}`.slice(0, 180) }))].sort((a, b) => b.score - a.score).slice(0, limit)
}

export function diversifyPicks(picks: RankedPick[], articles: Candidate[], limit = 10) {
  if (limit <= 0) return []
  const byId = new Map(articles.map((article) => [article.id, article]))
  const selected: RankedPick[] = []
  const sources = new Map<string, number>(); const categoriesUsed = new Map<string, number>()
  for (const constrained of [true, false]) {
    for (const pick of [...picks].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))) {
      const article = byId.get(pick.id)
      if (!article || selected.some((entry) => entry.id === pick.id || sameStory(article, byId.get(entry.id)!))) continue
      if (constrained && ((sources.get(article.source_id) ?? 0) >= 2 || (categoriesUsed.get(pick.category) ?? 0) >= 3)) continue
      selected.push(pick)
      sources.set(article.source_id, (sources.get(article.source_id) ?? 0) + 1)
      categoriesUsed.set(pick.category, (categoriesUsed.get(pick.category) ?? 0) + 1)
      if (selected.length === limit) return selected
    }
  }
  return selected
}

// Rank all fetched records before bounding the model input; no publisher monopolizes the pool.
export function selectionPool(articles: Candidate[], interests: Interest[], readIds: Set<string>, feedback: Feedback[], limit = 160) {
  articles = articles.filter(article=>editorialAllowed(article,interests))
  const byId = new Map(articles.map(article => [article.id, article]))
  const unread = articles.filter(article => !readIds.has(article.id))
  const pool = unread.length >= limit ? unread : articles
  const ranked = automaticPicks(pool, interests, readIds, feedback)
  const selected: Candidate[] = []; const sources = new Map<string, number>()
  for (const cap of [4, Infinity]) for (const pick of ranked) {
    const article = byId.get(pick.id)!
    if (selected.some(entry => entry.id === article.id) || (sources.get(article.source_id) ?? 0) >= cap) continue
    if (selected.some(entry => canonicalArticleUrl(entry.url) === canonicalArticleUrl(article.url))) continue
    selected.push(article); sources.set(article.source_id, (sources.get(article.source_id) ?? 0) + 1)
    if (selected.length === limit) return selected
  }
  return selected
}
