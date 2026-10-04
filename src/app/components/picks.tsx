import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArticleThumbnail, ArticleActions } from './ui'
import type { AiPick, OpenReader, ToggleSave } from './types'

function PickExplanation({ pick }: { pick: AiPick }) {
  return <details className="text-sm text-muted">
    <summary className="flex min-h-11 cursor-pointer items-center text-accent">Perché questa scelta</summary>
    <div className="space-y-2 pb-2 leading-6">
      <p>{pick.reason || 'Selezionata per attualità, interessi e priorità della fonte.'}</p>
      <p>Selezionata il <time dateTime={pick.created_at}>{new Date(pick.created_at).toLocaleString('it-IT')}</time> · {pick.selection_method === 'automatic' ? 'automatica' : 'IA'} · rilevanza {pick.score}/100.</p>
    </div>
  </details>
}

type PickProps = { pick: AiPick; saved: boolean; toggleSave: ToggleSave; openReader: OpenReader }
function PickCard({ pick, saved, toggleSave, openReader, featured = false }: PickProps & { featured?: boolean }) {
  const article = pick.articles
  if (!article) return null
  return <article className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5">
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-muted">
      <span>{article.sources?.name ?? 'Fonte'}</span>
      {article.published_at && <span>· {formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })}</span>}
      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-accent">{pick.selection_method === 'automatic' ? 'Per te' : 'Scelta IA'}</span>
    </div>
    <button onClick={() => openReader(article)} className="flex w-full items-start gap-4 text-left">
      <div className="min-w-0 flex-1">
        <h2 className={`${featured ? 'text-[22px] sm:text-2xl' : 'text-lg sm:text-xl'} font-semibold leading-snug tracking-tight text-foreground [overflow-wrap:anywhere]`}>{article.title}</h2>
        {featured && pick.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{pick.summary}</p>}
      </div>
      {article.image_url && <div className="w-20 shrink-0 sm:w-24"><ArticleThumbnail imageUrl={article.image_url} compact /></div>}
    </button>
    <div className="mt-2 flex flex-wrap items-start justify-between gap-x-3">
      <PickExplanation pick={pick} />
      <ArticleActions articleId={article.id} saved={saved} onClick={() => toggleSave(article.id)} small />
    </div>
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
  return <section><h2 className="mb-3 text-lg font-semibold">Altre scelte per te</h2><AiCurationView {...props} /></section>
}
