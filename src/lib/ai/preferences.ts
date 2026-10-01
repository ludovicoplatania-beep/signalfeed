export type Preference = 'like' | 'less_topic' | 'less_source'
export type Feedback = { article_id: string; preference: Preference | null; title: string; excerpt: string | null; source_id: string; source_name: string; updated_at: string }

const stopWords = new Set('della delle degli dello dalla dalle alle nelle nella per con una uno che come dopo oggi sono anche più non del dei gli tra nel sul sulla sui and the with for from this that news'.split(' '))
export function meaningfulTokens(text: string) {
  return new Set(text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(word => word.length > 3 && !stopWords.has(word)))
}
export function relatedTopic(article: { title: string; excerpt: string | null }, feedback: { title: string; excerpt: string | null }) {
  const left = meaningfulTokens(article.title + ' ' + (article.excerpt ?? '').slice(0, 300))
  const right = meaningfulTokens(feedback.title + ' ' + (feedback.excerpt ?? '').slice(0, 300))
  const common = [...left].filter(word => right.has(word)).length
  return common >= 2 && common / Math.max(1, Math.min(left.size, right.size)) >= 0.25
}
export function preferenceAdjustment(article: { id: string; source_id: string; title: string; excerpt: string | null }, feedback: Feedback[]) {
  let boost = 0; let penalty = 0
  for (const entry of feedback) {
    if (!entry.preference) continue
    if (entry.preference === 'like' && (entry.article_id === article.id || relatedTopic(article, entry))) boost = Math.max(boost, 25)
    if (entry.preference === 'less_source' && entry.source_id === article.source_id) penalty = Math.max(penalty, 60)
    if (entry.preference === 'less_topic' && (entry.article_id === article.id || relatedTopic(article, entry))) penalty = Math.max(penalty, 45)
  }
  return boost - penalty
}
