/** Card text comes from its own publisher record, never another model-selected ID. */
export function sourceSummary(article: { title: string; excerpt?: string | null; article_content?: string | null }) {
  const text = (article.excerpt?.trim() || article.article_content?.trim() || article.title).replace(/\s+/g, ' ')
  return text.length > 220 ? `${text.slice(0, 219).trimEnd()}…` : text
}

export function matchingTitle(actual: string, echoed: unknown) {
  const normalize = (text: string) => text.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
  return typeof echoed === 'string' && normalize(actual) === normalize(echoed)
}
