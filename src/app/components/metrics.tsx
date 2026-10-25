import { Led, Module, Readout } from './ui'
import type { AiPick, Article, SavedArticle, Source } from './types'

/** Barra di stato del pannello: dati vivi su fonti, notizie, scelte e salvati. */
export function StatusBar({ sources, articles, aiPicks, savedArticles, now, syncing }: { sources: Source[]; articles: Article[]; aiPicks: AiPick[]; savedArticles: SavedArticle[]; now: number; syncing: boolean }) {
  const active = sources.filter((source) => source.is_active)
  const healthy = active.filter((source) => !source.last_error && !source.is_stale).length
  const day = articles.filter((article) => article.published_at && now - new Date(article.published_at).getTime() < 86_400_000).length
  const last = Math.max(0, ...sources.map((source) => (source.last_checked_at ? new Date(source.last_checked_at).getTime() : 0)))
  const minutes = last ? Math.max(0, Math.round((now - last) / 60000)) : null
  const issues = active.length - healthy
  return (
    <Module
      label={<span className="flex items-center gap-2"><Led state={issues ? 'warn' : 'on'} pulse={syncing} />Stato</span>}
      meta={minutes === null ? 'Mai sincronizzato' : `Ultimo controllo ${minutes < 1 ? 'adesso' : `${minutes} min fa`}`}
      className="mb-4"
    >
      <div aria-label="Stato del feed" role="group" className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
        <Readout label="Fonti" value={healthy} total={active.length} level={active.length ? (healthy / active.length) * 100 : 0} />
        <Readout label="Notizie 24h" value={day} level={Math.min(100, day * 4)} />
        <Readout label="Scelte IA" value={aiPicks.length} level={Math.min(100, aiPicks.length * 20)} />
        <Readout label="Salvati" value={savedArticles.length} level={Math.min(100, savedArticles.length * 10)} />
      </div>
    </Module>
  )
}

export function Metrics({ sources, articles, aiPicks, savedArticles }: { sources: Source[]; articles: Article[]; aiPicks: AiPick[]; savedArticles: SavedArticle[] }) {
  return <section aria-label="Statistiche della biblioteca" className="mt-5 grid grid-cols-2 divide-x divide-y divide-line border border-line bg-surface sm:grid-cols-4 sm:divide-y-0">
    <Readout label="Fonti" value={sources.filter(source => source.is_active).length} />
    <Readout label="Notizie recenti" value={articles.length} />
    <Readout label="Scelte IA" value={aiPicks.length} />
    <Readout label="Salvati" value={savedArticles.length} />
  </section>
}
