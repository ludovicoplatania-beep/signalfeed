import type { Candidate } from './ranking'

export function topicInput(articles: Candidate[]) {
  return articles.map((article, index) => ({ ref: index + 1, title: article.title, source: article.source_name,
    excerpt: (article.excerpt?.trim() || article.article_content?.trim() || '').slice(0, 160), published_at: article.published_at }))
}
export function topicReferences(refs: unknown, articles: Candidate[]) {
  if (!Array.isArray(refs)) return []
  return [...new Set(refs.flatMap(ref => Number.isInteger(ref) && ref > 0 && ref <= articles.length ? [articles[ref - 1].id] : []))]
}
export function topicFormat(count: number) {
  return { type: 'json_schema' as const, json_schema: { name: 'topic_groups', strict: true, schema: {
    type: 'object', additionalProperties: false, required: ['topics'], properties: { topics: {
      type: 'array', maxItems: 8, items: { type: 'object', additionalProperties: false,
        required: ['title', 'description', 'score', 'articles', 'angle'], properties: {
          title: { type: 'string' }, description: { type: 'string' }, angle: { type: 'string' },
          score: { type: 'number', minimum: 1, maximum: 100 }, articles: { type: 'array', minItems: 2, maxItems: 8,
            items: { type: 'integer', enum: Array.from({length: count}, (_, i) => i + 1) } },
        },
      },
    } },
  } } }
}
