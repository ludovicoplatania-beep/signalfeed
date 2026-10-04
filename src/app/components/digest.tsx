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
    <section className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5   ">

      <div className="relative z-10 space-y-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
            <Sparkles size={13} />
            Briefing di oggi
          </div>

          <h3 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
            {digest.title}
          </h3>

          <p className="mt-4 text-sm leading-7 text-muted">
            {digest.summary}
          </p>
        </div>

        {keyPoints.length > 0 && (
          <div className="space-y-2">
            {keyPoints.map((point: string, index: number) => (
              <div
                key={index}
                className="rounded-2xl border border-line bg-surface p-3 text-sm leading-6 text-foreground"
              >
                <span className="mr-2 text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {point}
              </div>
            ))}
          </div>
        )}

        {recommended.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-accent">
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
                  className="group w-full rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-line hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
                    {item.title}
                  </div>

                  {item.reason && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted group-hover:text-muted">
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
