import type { AiPick, Article, SavedArticle, Source } from './types'

function AthenaMetric({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  return (
    <div className="group relative min-h-[142px] overflow-hidden rounded-[1.7rem] border border-[#B88A44]/12 bg-black/35 p-5 backdrop-blur-xl transition hover:border-[#B88A44]/25">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,154,82,0.12),transparent_55%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.10),transparent_50%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-600">
            {label}
          </div>

          <div className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">
            {value}
          </div>
        </div>

        <div className="mt-5 text-xs leading-5 text-neutral-500">
          {detail}
        </div>
      </div>
    </div>
  )
}

export function Metrics({
  sources,
  articles,
  aiPicks,
  savedArticles,
}: {
  sources: Source[]
  articles: Article[]
  aiPicks: AiPick[]
  savedArticles: SavedArticle[]
}) {
  const activeSources = sources.filter((source: Source) => source.is_active).length

  return (
    <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <AthenaMetric
        label="Source Network"
        value={activeSources}
        detail="Fonti attive nel sistema"
      />

      <AthenaMetric
        label="Signals"
        value={articles.length}
        detail="Articoli raccolti e analizzati"
      />

      <AthenaMetric
        label="AI Priority"
        value={aiPicks.length}
        detail="Selezioni editoriali prioritarie"
      />

      <AthenaMetric
        label="Archive"
        value={savedArticles.length}
        detail="Elementi salvati per dopo"
      />
    </section>
  )
}
