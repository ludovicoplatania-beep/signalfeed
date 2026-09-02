import { BookOpen, Sparkles } from 'lucide-react'
import type { Article, Digest, OpenReader, RecommendedArticle } from './types'

export function DigestPanel({
  digest,
  articles,
  openReader,
}: {
  digest?: Digest
  articles: Article[]
  openReader: OpenReader
}) {
  if (!digest) return null

  const recommended = Array.isArray(digest.recommended_articles)
    ? digest.recommended_articles
    : []

  const keyPoints = Array.isArray(digest.key_points)
    ? digest.key_points
    : []

  function findArticle(articleId: string) {
    return articles.find((article) => article.id === articleId)
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#B88A44]/18 bg-black/45 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,154,82,0.16),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.14),transparent_50%)]" />

      <div className="relative z-10 space-y-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#B88A44]/20 bg-black/40 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#E2C188]">
            <Sparkles size={13} />
            Briefing di oggi
          </div>

          <h3 className="text-2xl font-semibold leading-tight tracking-[-0.045em] text-white">
            {digest.title}
          </h3>

          <p className="mt-4 text-sm leading-7 text-neutral-400">
            {digest.summary}
          </p>
        </div>

        {keyPoints.length > 0 && (
          <div className="space-y-2">
            {keyPoints.map((point: string, index: number) => (
              <div
                key={index}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 text-sm leading-6 text-neutral-300"
              >
                <span className="mr-2 text-[#C59A52]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {point}
              </div>
            ))}
          </div>
        )}

        {recommended.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#E2C188]">
              <BookOpen size={15} />
              Letture consigliate
            </div>

            {recommended.map((item: RecommendedArticle, index: number) => {
              const article = findArticle(item.id)

              return (
                <button
                  key={index}
                  onClick={() => article && openReader(article)}
                  disabled={!article}
                  className="group w-full rounded-2xl border border-white/[0.06] bg-black/30 p-3 text-left transition hover:border-[#B88A44]/25 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="line-clamp-2 text-sm font-medium leading-5 text-white">
                    {item.title}
                  </div>

                  {item.reason && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500 group-hover:text-neutral-400">
                      {item.reason}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
