import { BookOpen } from 'lucide-react'
import { Led, Module } from './ui'
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
    <Module label={<span className="flex items-center gap-2"><Led />Briefing di oggi</span>}>
      <div className="space-y-5 p-3 sm:p-4">
        <div>
          <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
            {digest.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted">
            {digest.summary}
          </p>
        </div>

        {keyPoints.length > 0 && (
          <ol className="border-t border-line">
            {keyPoints.map((point: string, index: number) => (
              <li
                key={index}
                className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-b border-line py-2.5 text-sm leading-6 text-foreground"
              >
                <span className="te-label pt-1 tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {point}
              </li>
            ))}
          </ol>
        )}

        {recommended.length > 0 && (
          <div>
            <div className="te-label mb-1 flex items-center gap-2 text-foreground">
              <BookOpen size={13} aria-hidden="true" />
              Letture consigliate
            </div>

            {recommended.map((item: RecommendedArticle, index: number) => {
              const article = findArticle(item.id)

              return (
                <button
                  key={index}
                  onClick={() => article && openReader(article)}
                  disabled={!article}
                  className="group block w-full border-b border-line py-3 text-left transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
                    {item.title}
                  </div>

                  {item.reason && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">
                      {item.reason}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Module>
  )
}
