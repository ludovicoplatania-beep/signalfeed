const trackingParameter = /^(utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|_ga|_gl|ref_src|ref_url)$/i

/** Identity only: keep the publisher's original URL for navigation. */
export function canonicalArticleUrl(raw: string) {
  const url = new URL(raw)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('URL articolo non valido')
  }
  url.protocol = 'https:'
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  if (url.port === '80' || url.port === '443') url.port = ''
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (trackingParameter.test(key)) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url.toString().replace(/\/(?=\?|$)/, '')
}

export function articleDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  // Reject malformed feed dates and future dates that would monopolize ranking.
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now() + 86_400_000
    ? date.toISOString() : null
}

export function uniqueArticles<T extends { id: string; url: string }>(articles: T[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    let key: string
    try { key = canonicalArticleUrl(article.url) } catch { key = article.id }
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Publisher event listings are not editorial articles. */
export function isEditorialArticle(raw: string) {
  try {
    const url = new URL(raw)
    return !(url.hostname.replace(/^www\./, '') === 'internazionale.it' && /^\/festival(?:_|\/)/i.test(url.pathname))
  } catch { return false }
}
