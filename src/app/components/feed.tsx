import { useState } from 'react'
import { ReadingDensity, useReadingDensity } from './reading-density'
import { LibraryEditor, useLibrary } from './library'
import { OfflineDownload } from './offline-download'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { Clock3 } from 'lucide-react'
import { ArticleThumbnail, EmptyState, ArticleActions } from './ui'
import type { Article, OpenReader, SavedArticle, ToggleSave } from './types'
import { groupStories } from '@/lib/articles/stories'

type FeedListProps = {
  articles: Article[]
  savedIds: Set<string>
  toggleSave: ToggleSave
  openReader: OpenReader
  title: string
  subtitle: string
  library?: boolean
  showDensity?: boolean
}

export function FeedList({ articles, savedIds, toggleSave, openReader, title, subtitle, library = false, showDensity = true }: FeedListProps) {
  const compact = useReadingDensity()
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><div>
        <h2 className="text-xl font-medium tracking-[-0.04em] text-foreground sm:text-2xl">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p></div>{showDensity && <ReadingDensity />}
      </div>

      <div className="min-w-0">
        {articles.length === 0 ? (
          <EmptyState text="Nessun articolo trovato." />
        ) : (
          (library ? articles.map(article=>({article,alternatives:[] as Article[]})) : groupStories(articles)).map(({ article, alternatives }) => (
            <article
              key={article.id}
              className={`article-row ${compact ? 'py-3' : 'py-4 sm:py-5'} grid grid-cols-[minmax(0,1fr)_80px] gap-x-4 gap-y-2 border-b border-line last:border-b-0 sm:grid-cols-[minmax(0,1fr)_96px]`}
            >
              {article.image_url && <button onClick={() => openReader(article)} aria-label={`Leggi: ${article.title}`} className="col-start-2 row-start-1 self-start text-left">
                <ArticleThumbnail imageUrl={article.image_url} compact />
              </button>}

              <button onClick={() => openReader(article)} className={`col-start-1 row-start-1 min-w-0 text-left ${article.image_url ? '' : 'col-span-full'}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{article.sources?.name ?? 'Fonte'}</span>
                  <span>•</span>
                  <Clock3 size={13} />
                  <span>
                    {article.published_at
                      ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })
                      : 'Data non disponibile'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold [overflow-wrap:anywhere] leading-snug tracking-[-0.02em] text-foreground sm:text-lg md:text-xl">
                  {article.title}
                </h3>

                {!compact && article.excerpt && (
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-muted">
                    {article.excerpt}
                  </p>
                )}
              </button>

              <div className="col-span-full flex items-center justify-start">
                <ArticleActions articleId={article.id} saved={savedIds.has(article.id)} onClick={() => toggleSave(article.id)} small />
              </div>
              {library && <details className="col-span-full text-sm text-muted"><summary className="min-h-11 cursor-pointer py-2 text-accent">Organizza e scarica</summary><LibraryEditor id={article.id} /><OfflineDownload article={article} /></details>}
              {alternatives.length > 0 && <details className="col-span-full rounded-xl border border-line bg-surface p-3 text-sm text-foreground">
                <summary className="cursor-pointer">Altre coperture ({alternatives.length})</summary>
                <div className="mt-3 space-y-2">{alternatives.map(alternative => <button key={alternative.id} className="block w-full rounded-lg p-2 text-left hover:bg-surface" onClick={() => openReader(alternative)}><span className="text-accent">{alternative.sources?.name ?? 'Fonte'}</span> · {alternative.title}</button>)}</div>
              </details>}
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export function SavedView({
  savedArticles,
  toggleSave,
  openReader,
}: {
  savedArticles: SavedArticle[]
  toggleSave: ToggleSave
  openReader: OpenReader
}) {
  const { entries, error } = useLibrary()
  const [query, setQuery] = useState('')
  const [folder, setFolder] = useState('')
  const [state, setState] = useState('all')
  const folders = [...new Set(savedArticles.map(v=>entries[v.article_id]?.folder).filter((v): v is string => Boolean(v)))].sort()
  const articles = savedArticles
    .map((item) => item.articles)
    .filter((article): article is Article => Boolean(article))
    .filter(article=>{const entry=entries[article.id];return (!folder||entry?.folder===folder) && (state==='all'||(state==='read'?Boolean(entry?.read_at):!entry?.read_at)) && `${article.title} ${article.excerpt??''} ${article.article_content??''} ${article.sources?.name??''} ${entry?.tags.join(' ')??''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())})

  return (
    <div>
      <div className="mb-4"><a href="/offline.html" className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-accent">Biblioteca offline</a><p className="mt-2 text-sm text-muted">Scarica gli articoli prima di scollegarti. Le copie e le traduzioni restano su questo dispositivo, fino alla rimozione o alla pulizia dei dati del browser.</p></div><div className="mb-5 grid gap-3 sm:grid-cols-3"><input aria-label="Cerca nei salvati" placeholder="Cerca titolo, testo, fonte o tag" value={query} onChange={e=>setQuery(e.target.value)} className="min-h-11 rounded-xl border border-line bg-surface px-3"/><select aria-label="Filtra cartella" value={folder} onChange={e=>setFolder(e.target.value)} className="min-h-11 rounded-xl border border-line bg-background px-3"><option value="">Tutte le cartelle</option>{folders.map(name=><option key={name}>{name}</option>)}</select><select aria-label="Filtra lettura" value={state} onChange={e=>setState(e.target.value)} className="min-h-11 rounded-xl border border-line bg-background px-3"><option value="all">Tutti</option><option value="unread">Da leggere</option><option value="read">Letti</option></select></div>
      {error&&<p role="alert" className="mb-3 text-warning">{error}</p>}
    <FeedList
      library
      articles={articles}
      savedIds={new Set(articles.map((article) => article.id))}
      toggleSave={toggleSave}
      openReader={openReader}
      title="Salvati"
      subtitle={`${articles.length} articoli · ricerca e organizzazione sincronizzate tra dispositivi.`}
    />
    </div>
  )
}
