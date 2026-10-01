import { canonicalArticleUrl } from '@/lib/articles/identity'

export const categories = ['Tecnologia', 'Intelligenza artificiale', 'Economia', 'Politica', 'Esteri', 'Salute', 'Ambiente', 'Scienza', 'Cultura', 'Cinema e media', 'Cronaca', 'Sport', 'Generale'] as const
export type Candidate = {
  id: string; title: string; url: string; excerpt: string | null; article_content: string | null
  published_at: string | null; created_at: string; source_id: string; source_name: string; source_priority: number
}
export type RankedPick = {
  id: string; score: number; summary: string; reason: string; category: string; selection_method: 'ai' | 'automatic'
}

export function categoryFor(article: Pick<Candidate, 'title' | 'excerpt'>, proposed?: string) {
  const known = categories.find((category) => category.toLowerCase() === proposed?.trim().toLowerCase())
  if (known && known !== 'Generale') return known
  const text = `${article.title} ${article.excerpt ?? ''}`.toLowerCase()
  const rules: Array<[string, RegExp]> = [
    ['Intelligenza artificiale', /\b(ai|ia|intelligenza artificiale|openai|anthropic|chatgpt|claude|gemini)\b/i],
    ['Cinema e media', /\b(film|cinema|serie tv|streaming|netflix|disney|regista|attor\w*)\b/i],
    ['Tecnologia', /\b(software|smartphone|android|iphone|google|microsoft|cyber\w*|robot\w*|app)\b/i],
    ['Economia', /\b(economia|mercati|borsa|aziend\w*|imprese|lavoro|inflazione|banch\w*)\b/i],
    ['Salute', /\b(salute|sanità|medic\w*|ospedale|virus|farmac\w*|malattia)\b/i],
    ['Ambiente', /\b(clima|ambiente|energia|incendio|alluvione|emissioni)\b/i],
    ['Politica', /\b(governo|parlamento|elezioni|ministr\w*|partito|politica)\b/i],
    ['Sport', /\b(calcio|tennis|motogp|gara|campionato|partita|atleta)\b/i],
    ['Cronaca', /\b(incidente|arrest\w*|inchiesta|morto|ferito|polizia|carabinieri)\b/i],
  ]
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? known ?? 'Generale'
}

function titleTokens(title: string) {
  return new Set(title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((word) => word.length > 2 || /^\d+$/.test(word)))
}
export function sameStory(a: Candidate, b: Candidate) {
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
  const ordered = [...groups].sort((a, b) => (b[0]?.source_priority ?? 0) - (a[0]?.source_priority ?? 0))
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

export function automaticPicks(articles: Candidate[], interests: Array<{ topic: string; score: number }>, readIds: Set<string>) {
  return articles.map((article): RankedPick => {
    const age = Math.max(0, (Date.now() - new Date(article.published_at || article.created_at).getTime()) / 3_600_000)
    const freshness = age < 6 ? 80 : age < 24 ? 70 : age < 72 ? 55 : age < 168 ? 40 : 20
    const text = `${article.title} ${article.excerpt ?? ''}`.toLowerCase()
    const affinity = interests.reduce((score, interest) => {
      const words = [...titleTokens(interest.topic)]
      return Math.max(score, words.some((word) => text.includes(word)) ? Math.min(12, interest.score / 8) : 0)
    }, 0)
    return { id: article.id, score: Math.max(1, Math.min(99, Math.round(freshness + affinity + article.source_priority * 2 - (readIds.has(article.id) ? 15 : 0)))),
      summary: (article.excerpt || article.title).slice(0, 220), category: categoryFor(article), selection_method: 'automatic',
      reason: `${readIds.has(article.id) ? 'Approfondimento già consultato' : 'Articolo non ancora consultato'} · ${article.source_name}. Ordinato per attualità, interessi e priorità della fonte.`.slice(0, 180) }
  }).sort((a, b) => b.score - a.score)
}

export function diversifyPicks(picks: RankedPick[], articles: Candidate[], limit = 10) {
  const byId = new Map(articles.map((article) => [article.id, article]))
  const selected: RankedPick[] = []
  const sources = new Map<string, number>(); const categoriesUsed = new Map<string, number>()
  for (const constrained of [true, false]) {
    for (const pick of [...picks].sort((a, b) => b.score - a.score)) {
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
