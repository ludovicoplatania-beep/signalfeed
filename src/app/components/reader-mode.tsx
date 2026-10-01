import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock3, ExternalLink, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArticleImage, ArticleActions } from './ui'
import type { Article, ToggleSave } from './types'

export function ReaderMode({
  article,
  saved,
  toggleSave,
  close,
}: {
  article: Article
  saved: boolean
  toggleSave: ToggleSave
  close: () => void
}) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey) }
  }, [close])
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#070708]/96 text-white backdrop-blur-2xl"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,154,82,0.14),transparent_34%),radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%)]" />

      <div className="relative mx-auto max-w-6xl px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 md:px-10 md:py-10">
        <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <button onClick={close} className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/45 px-4 py-2.5 text-sm text-neutral-300 backdrop-blur-xl transition hover:border-[#B88A44]/30 hover:text-white">
            <ArrowLeft size={16} />Torna
          </button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#B88A44]/25 bg-[linear-gradient(180deg,rgba(197,154,82,0.20),rgba(0,0,0,0.35))] px-3 py-2.5 text-sm font-medium text-[#E2C188] backdrop-blur-xl transition hover:border-[#C59A52]/50 sm:order-last">
            <ExternalLink size={16} className="shrink-0" />Fonte originale
          </a>
          <div className="col-span-full flex justify-end sm:ml-auto"><ArticleActions articleId={article.id} saved={saved} onClick={() => toggleSave(article.id)} small /></div>
        </div>

        <article className="overflow-hidden rounded-3xl border border-[#B88A44]/14 bg-black/45 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="relative min-h-[240px] overflow-hidden md:h-[500px]">
            <ArticleImage imageUrl={article.image_url} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(197,154,82,0.20),transparent_32%),radial-gradient(circle_at_15%_12%,rgba(139,92,246,0.20),transparent_28%)]" />

            <div className="relative px-5 pb-5 pt-24 md:absolute md:bottom-0 md:left-0 md:right-0 md:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-[#B88A44]/20 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#E2C188] backdrop-blur-xl">
                  {article.sources?.name ?? 'Fonte'}
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/35 px-3 py-1 text-xs text-neutral-400 backdrop-blur-xl">
                  <Clock3 size={13} />
                  {article.published_at
                    ? formatDistanceToNow(new Date(article.published_at), {
                        addSuffix: true,
                        locale: it,
                      })
                    : 'Data non disponibile'}
                </div>
              </div>

              <h1 className="max-w-5xl text-2xl font-semibold [overflow-wrap:anywhere] leading-[1.12] sm:text-3xl tracking-[-0.06em] text-white md:text-5xl lg:text-6xl">
                {article.title}
              </h1>
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-5 py-9 md:px-0 md:py-14">
            {article.excerpt && (
              <section className="rounded-[2rem] border border-[#8b5cf6]/14 bg-white/[0.03] p-5 backdrop-blur-xl">
                <div className="mb-3 flex items-center gap-2 text-sm text-[#E2C188]">
                  <Sparkles size={15} />
                  Introduzione della fonte
                </div>

                <p className="text-lg leading-8 text-neutral-300">
                  {article.excerpt}
                </p>
              </section>
            )}

            {article.article_content ? (
              <div className="mt-10 whitespace-pre-line text-lg leading-9 text-neutral-300">
                {article.article_content}
              </div>
            ) : (
              <div className="mt-10 rounded-3xl border border-white/[0.08] bg-black/25 p-6 text-sm leading-7 text-neutral-400">
                Testo completo non disponibile per questo articolo. Puoi comunque aprire la fonte originale.
              </div>
            )}
          </div>
        </article>
      </div>
    </motion.div>
  )
}
