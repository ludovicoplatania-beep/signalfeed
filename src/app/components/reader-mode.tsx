import { motion } from 'framer-motion'
import { ArrowLeft, Clock3, ExternalLink, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArticleImage, SaveButton } from './ui'
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#050505]/96 text-white backdrop-blur-2xl"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,154,82,0.14),transparent_34%),radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-5 md:px-10 md:py-10">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={close}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/45 px-4 py-2.5 text-sm text-neutral-300 backdrop-blur-xl transition hover:border-[#B88A44]/30 hover:text-white"
          >
            <ArrowLeft size={16} />
            Torna
          </button>

          <div className="flex flex-wrap gap-3">
            <SaveButton saved={saved} onClick={() => toggleSave(article.id)} />

            <a
              href={article.url}
              target="_blank"
              className="flex items-center gap-2 rounded-2xl border border-[#B88A44]/25 bg-[linear-gradient(180deg,rgba(197,154,82,0.20),rgba(0,0,0,0.35))] px-4 py-3 text-sm font-medium text-[#E2C188] backdrop-blur-xl transition hover:border-[#C59A52]/50"
            >
              <ExternalLink size={16} />
              Fonte originale
            </a>
          </div>
        </div>

        <article className="overflow-hidden rounded-[2.5rem] border border-[#B88A44]/14 bg-black/45 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="relative h-[300px] overflow-hidden md:h-[500px]">
            <ArticleImage imageUrl={article.image_url} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(197,154,82,0.20),transparent_32%),radial-gradient(circle_at_15%_12%,rgba(139,92,246,0.20),transparent_28%)]" />

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
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
                    : 'Adesso'}
                </div>
              </div>

              <h1 className="max-w-5xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-6xl">
                {article.title}
              </h1>
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-5 py-9 md:px-0 md:py-14">
            {article.excerpt && (
              <section className="rounded-[2rem] border border-[#8b5cf6]/14 bg-white/[0.03] p-5 backdrop-blur-xl">
                <div className="mb-3 flex items-center gap-2 text-sm text-[#E2C188]">
                  <Sparkles size={15} />
                  Sintesi Athena
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
