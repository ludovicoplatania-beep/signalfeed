import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArticleThumbnail, ArticleActions, Led, Meter } from './ui'
import type { AiPick, OpenReader, ToggleSave } from './types'

function PickExplanation({ pick }: { pick: AiPick }) {
  return <details className="min-w-0 flex-1 text-sm text-muted">
    <summary className="te-label flex min-h-11 cursor-pointer items-center text-accent">Perché questa scelta</summary>
    <div className="space-y-2 pb-3 pr-3 leading-6">
      <p>{pick.reason || 'Selezionata per attualità, interessi e priorità della fonte.'}</p>
      <p>Selezionata il <time dateTime={pick.created_at}>{new Date(pick.created_at).toLocaleString('it-IT')}</time> · {pick.selection_method === 'automatic' ? 'automatica' : 'IA'} · rilevanza {pick.score}/100.</p>
    </div>
  </details>
}

type PickProps = { pick: AiPick; saved: boolean; toggleSave: ToggleSave; openReader: OpenReader }
function PickCard({ pick, saved, toggleSave, openReader, featured = false }: PickProps & { featured?: boolean }) {
  const article = pick.articles
  if (!article) return null
  return <article className="min-w-0 border border-line bg-surface">
    <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
      <span className="te-label flex items-center gap-2 text-foreground"><Led />{pick.selection_method === 'automatic' ? 'Per te' : 'Scelta IA'}</span>
      <span className="te-label flex items-center gap-2 tabular-nums">Rel {pick.score}<Meter value={pick.score} segments={5} className="w-10" /></span>
    </header>
    <button onClick={() => openReader(article)} className="flex w-full items-start gap-3 p-3 text-left sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="te-label mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-foreground">{article.sources?.name ?? 'Fonte'}</span>
          {article.published_at && <><span aria-hidden="true">/</span><span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })}</span></>}
        </div>
        <h2 className={`${featured ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} font-semibold leading-snug tracking-[-0.01em] text-foreground [overflow-wrap:anywhere]`}>{article.title}</h2>
        {featured && pick.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{pick.summary}</p>}
      </div>
      {article.image_url && <div className="w-16 shrink-0 sm:w-20"><ArticleThumbnail imageUrl={article.image_url} compact /></div>}
    </button>
    <footer className="flex items-start justify-between gap-x-3 border-t border-line pl-3">
      <PickExplanation pick={pick} />
      <ArticleActions articleId={article.id} saved={saved} onClick={() => toggleSave(article.id)} small framed={false} />
    </footer>
  </article>
}
export function HeroPick(props: PickProps) { return <PickCard {...props} featured /> }
export function SidePick(props: PickProps) { return <PickCard {...props} /> }
type PickListProps = { picks: AiPick[]; savedIds: Set<string>; toggleSave: ToggleSave; openReader: OpenReader }
export function AiCurationView({ picks, savedIds, toggleSave, openReader }: PickListProps) {
  return <div className="grid items-start gap-3 md:grid-cols-2">{picks.map(pick => <SidePick key={pick.id} pick={pick} saved={Boolean(pick.articles && savedIds.has(pick.articles.id))} toggleSave={toggleSave} openReader={openReader} />)}</div>
}
export function AiSideList(props: PickListProps) {
  if (!props.picks.length) return null
  return <section><h2 className="te-label mb-3 text-foreground">Altre scelte per te</h2><AiCurationView {...props} /></section>
}
