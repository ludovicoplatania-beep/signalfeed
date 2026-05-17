import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArrowLeft, Clock3, ExternalLink } from 'lucide-react'
import { ArticleImage, SaveButton } from './ui'

export function ReaderMode({ article, saved, toggleSave, close }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#050505]/95 text-white backdrop-blur-xl"
    >
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-10 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={close}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.08]"
          >
            <ArrowLeft size={16} />
            Torna
          </button>

          <div className="flex flex-wrap gap-3">
            <SaveButton saved={saved} onClick={() => toggleSave(article.id)} />

            <a
              href={article.url}
              target="_blank"
              className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white px-4 py-3 text-sm font-medium text-black hover:bg-neutral-200"
            >
              <ExternalLink size={16} />
              Fonte originale
            </a>
          </div>
        </div>

        <article className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.035] md:rounded-[2.5rem]">
          <div className="relative h-[260px] overflow-hidden md:h-[460px]">
            <ArticleImage imageUrl={article.image_url} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>

          <div className="mx-auto max-w-3xl px-5 py-8 md:px-0 md:py-14">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>{article.sources?.name ?? 'Fonte'}</span>
              <span>•</span>
              <Clock3 size={14} />
              <span>
                {article.published_at
                  ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })
                  : 'Adesso'}
              </span>
            </div>

            <h1 className="text-3xl font-semibold leading-[1.06] tracking-[-0.055em] md:text-6xl">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-7 text-lg leading-8 text-neutral-300 md:text-xl md:leading-9">
                {article.excerpt}
              </p>
            )}

            {article.article_content ? (
              <div className="mt-10 whitespace-pre-line text-base leading-8 text-neutral-300 md:text-lg md:leading-9">
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
