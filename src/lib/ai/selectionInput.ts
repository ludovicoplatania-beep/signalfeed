import type { Candidate } from './ranking'
import { categories } from './ranking'
import { preferenceAdjustment, type Feedback } from './preferences'

export function selectionArticles(articles: Candidate[], readIds: Set<string>, feedback: Feedback[]) {
  return articles.map((article, index) => ({ ref: index + 1, title: article.title, source: article.source_name,
    priority: article.source_priority, excerpt: (article.excerpt?.trim() || article.article_content?.trim() || '').slice(0, 320),
    published_at: article.published_at, already_read: readIds.has(article.id), explicit_affinity: preferenceAdjustment(article, feedback) }))
}

// Only existing references can be generated. Displayed title/text come from that record.
export function selectionFormat(count: number) {
  return { type: 'json_schema' as const, json_schema: { name: 'editorial_selection', strict: true, schema: {
    type: 'object', additionalProperties: false, required: ['picks'], properties: { picks: {
      type: 'array', minItems: Math.min(10, count), maxItems: Math.min(10, count), items: {
        type: 'object', additionalProperties: false, required: ['ref', 'score', 'reason', 'category'], properties: {
          ref: { type: 'integer', enum: Array.from({ length: count }, (_, index) => index + 1) },
          score: { type: 'number', minimum: 1, maximum: 100 }, reason: { type: 'string' },
          category: { type: 'string', enum: [...categories] },
        },
      },
    } },
  } } }
}
