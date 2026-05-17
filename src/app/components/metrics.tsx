import type { Source } from './types'
import { Metric } from './ui'

export function Metrics({ sources, articles, aiPicks, savedArticles }: any) {
  return (
    <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <Metric label="Fonti attive" value={sources.filter((s: Source) => s.is_active).length} />
      <Metric label="Articoli raccolti" value={articles.length} />
      <Metric label="Scelte AI" value={aiPicks.length} />
      <Metric label="Salvati" value={savedArticles.length} />
    </section>
  )
}
