import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { Clock3 } from 'lucide-react'
import { ArticleThumbnail, EmptyState, SaveButton } from './ui'

export function FeedList({ articles, savedIds, toggleSave, openReader, title, subtitle }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-5">
        <h2 className="text-3xl font-medium tracking-[-0.04em] text-white">{title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025]">
        {articles.length === 0 ? (
          <EmptyState text="Nessun articolo trovato." />
        ) : (
          articles.map((article: any, index: number) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.015 }}
              className="grid gap-4 border-b border-white/[0.06] p-4 transition last:border-b-0 hover:bg-white/[0.04] md:grid-cols-[112px_1fr_120px] md:p-5"
            >
              <button onClick={() => openReader(article)} className="text-left">
                <ArticleThumbnail imageUrl={article.image_url} />
              </button>

              <button onClick={() => openReader(article)} className="text-left">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>{article.sources?.name ?? 'Fonte'}</span>
                  <span>•</span>
                  <Clock3 size={13} />
                  <span>
                    {article.published_at
                      ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })
                      : 'Adesso'}
                  </span>
                </div>

                <h3 className="text-lg font-medium leading-snug tracking-[-0.025em] text-neutral-100 md:text-xl">
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-neutral-500">
                    {article.excerpt}
                  </p>
                )}
              </button>

              <div className="flex items-start justify-end">
                <SaveButton saved={savedIds.has(article.id)} onClick={() => toggleSave(article.id)} />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export function SavedView({ savedArticles, toggleSave, openReader }: any) {
  const articles = savedArticles.map((item: any) => item.articles).filter(Boolean)

  return (
    <FeedList
      articles={articles}
      savedIds={new Set(articles.map((a: any) => a.id))}
      toggleSave={toggleSave}
      openReader={openReader}
      title="Saved"
      subtitle="Articoli salvati per leggerli dopo."
    />
  )
}
