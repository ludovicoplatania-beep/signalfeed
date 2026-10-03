import { useState } from 'react'
import { LibraryEditor, useLibrary } from './library'
import { motion } from 'framer-motion'
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
}

export function FeedList({ articles, savedIds, toggleSave, openReader, title, subtitle, library = false }: FeedListProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-5">
        <h2 className="text-xl font-medium tracking-[-0.04em] text-white sm:text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
        {articles.length === 0 ? (
          <EmptyState text="Nessun articolo trovato." />
        ) : (
          (library ? articles.map(article=>({article,alternatives:[] as Article[]})) : groupStories(articles)).map(({ article, alternatives }, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.015 }}
              className="grid grid-cols-1 gap-3 border-b border-white/[0.06] p-4 transition last:border-b-0 hover:bg-white/[0.04] md:grid-cols-[96px_minmax(0,1fr)] xl:grid-cols-[112px_minmax(0,1fr)_auto] md:gap-4 md:p-5"
            >
              <button onClick={() => openReader(article)} className="hidden text-left md:block">
                <ArticleThumbnail imageUrl={article.image_url} />
              </button>

              <button onClick={() => openReader(article)} className="min-w-0 text-left">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span>{article.sources?.name ?? 'Fonte'}</span>
                  <span>•</span>
                  <Clock3 size={13} />
                  <span>
                    {article.published_at
                      ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })
                      : 'Data non disponibile'}
                  </span>
                </div>

                <h3 className="text-base font-medium [overflow-wrap:anywhere] leading-snug tracking-[-0.02em] text-neutral-100 sm:text-lg md:text-xl">
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-neutral-400">
                    {article.excerpt}
                  </p>
                )}
              </button>

              <div className="flex items-center justify-start md:col-start-2 xl:col-start-auto xl:items-start xl:justify-end">
                <ArticleActions articleId={article.id} saved={savedIds.has(article.id)} onClick={() => toggleSave(article.id)} small />
              </div>
              {library && <div className="col-span-full md:col-start-2"><LibraryEditor id={article.id} /></div>}
              {alternatives.length > 0 && <details className="col-span-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-neutral-300 md:col-start-2">
                <summary className="cursor-pointer">Altre coperture ({alternatives.length})</summary>
                <div className="mt-3 space-y-2">{alternatives.map(alternative => <button key={alternative.id} className="block w-full rounded-lg p-2 text-left hover:bg-white/5" onClick={() => openReader(alternative)}><span className="text-[#C59A52]">{alternative.sources?.name ?? 'Fonte'}</span> · {alternative.title}</button>)}</div>
              </details>}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
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
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><input aria-label="Cerca nei salvati" placeholder="Cerca titolo, testo, fonte o tag" value={query} onChange={e=>setQuery(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3"/><select aria-label="Filtra cartella" value={folder} onChange={e=>setFolder(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#111] px-3"><option value="">Tutte le cartelle</option>{folders.map(name=><option key={name}>{name}</option>)}</select><select aria-label="Filtra lettura" value={state} onChange={e=>setState(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#111] px-3"><option value="all">Tutti</option><option value="unread">Da leggere</option><option value="read">Letti</option></select></div>
      {error&&<p role="alert" className="mb-3 text-amber-300">{error}</p>}
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
