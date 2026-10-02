import { classifyArticle, type Sector } from './catalog'
const legalTitle = /\b(cassazione|giurisprudenza|tribunal\w*|sentenz\w*|giustizia|penal\w*|criminal\w*|bancarotta|processo|procedura|codice|decreto|legislat\w*|riforma|cautelar\w*|custodia|ricorso|imputat\w*|assolt\w*|assolve|condann\w*|arrest\w*|corruzione|law|lawsuit\w*|legal|judicial|court|justice)\b|\bart\.?\s*\d|corte (costituzionale|europea|d.appello|di cassazione)/i
const legalProfessional = /cassazione|giurisprudenza|corte costituzionale|processo penal|codice penal|procedura penal|cautelar|bancarotta|imputat|assolve|violenza di gruppo|corruzione|reato|criminal (court|trial)|supreme court/i
const gamingTerms = /videogio\w*|video games?|gaming|gameplay|playstation|xbox|nintendo|steam|esports?|ubisoft|rockstar|bethesda|capcom|elden ring|final fantasy|pok[eé]mon|fortnite|minecraft|baldur|resident evil|call of duty|game pass|game (review|release|developer)|giochi (pc|console)/i
const aiTerms = /intelligenza artificiale|artificial intelligence|machine learning|deep learning|generative ai|AI[- ](model|agent|tool|research|system|platform)|chatgpt|openai|anthropic|deepmind|hugging face|modelli linguistici|reti neurali|\b(LLM|GPT[- ]?\d+|AI|AGI)\b/
const techTerms = /\b(software|hardware|smartphone|android|iphone|apple|microsoft|google|nvidia|intel|amd|computer|computing|malware|ransomware|chip|semiconduttor\w*|semiconductor\w*|cyber(?!punk)\w*)\b|sicurezza informatica|data breach|stampa 3d/i

/** Require subject evidence in the title or introduction, not incidental words in a long excerpt. */
export function sectorRelevance(article: {title:string;excerpt?:string|null}, sector: Sector): number {
  const intro = (article.excerpt ?? '').slice(0,240)
  const titleMatch = classifyArticle({title:article.title}).includes(sector.slug)
  if (!classifyArticle(article).includes(sector.slug)) return 0
  if (sector.slug === 'videogiochi') {
    // Medical consoles and Nintendo-themed merchandise are not game coverage.
    if (/chirurg\w*|ospedal\w*|operatorio|medical|surgery|ferrovia/i.test(article.title) && !gamingTerms.test(article.title)) return 0
    if (/\b(preorder|preordini|preordine)\b/i.test(article.title) && /\bAmazon\b/i.test(article.title)) return 0
    return gamingTerms.test(article.title) ? 12 : gamingTerms.test(intro) ? 4 : 0
  }
  if (sector.slug === 'diritto') {
    if (/\b(serie|film|netflix|movie|television)\b/i.test(article.title) && !legalTitle.test(article.title)) return 0
    if (!legalTitle.test(article.title) && (intro.match(new RegExp(legalTitle.source,'gi')) ?? []).length < 2) return 0
    return legalProfessional.test(`${article.title} ${intro}`) ? 24 : legalTitle.test(article.title) ? 8 : 4
  }
  if (sector.slug === 'ia') return titleMatch ? 12 : aiTerms.test(intro) ? 4 : 0
  if (sector.slug === 'tecnologia') {
    if (techTerms.test(article.title) || aiTerms.test(article.title) || /\brobot\w*\b/i.test(article.title)) return 12
    const matches = intro.match(new RegExp(techTerms.source,'gi')) ?? []
    return new Set(matches.map(term=>term.toLowerCase())).size >= 2 || aiTerms.test(intro) ? 4 : 0
  }
  return titleMatch ? 12 : 4
}
