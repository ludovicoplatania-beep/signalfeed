import type { AiPick, Article, SavedArticle, Source } from './types'
export function Metrics({ sources, articles, aiPicks, savedArticles }: { sources: Source[]; articles: Article[]; aiPicks: AiPick[]; savedArticles: SavedArticle[] }) {
  return <section aria-label="Statistiche della biblioteca" className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm text-muted">
    <span>{sources.filter(source => source.is_active).length} fonti</span><span>{articles.length} notizie recenti</span><span>{aiPicks.length} scelte IA</span><span>{savedArticles.length} salvati</span>
  </section>
}
