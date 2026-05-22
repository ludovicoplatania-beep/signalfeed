import { BookOpen, Sparkles } from 'lucide-react'
import { Panel } from './ui'

export function DigestPanel({ digest, articles, openReader }: any) {
  if (!digest) return null

  const recommended = Array.isArray(digest.recommended_articles)
    ? digest.recommended_articles
    : []

  const keyPoints = Array.isArray(digest.key_points)
    ? digest.key_points
    : []

  function findArticle(articleId: string) {
    return articles.find((article: any) => article.id === articleId)
  }

  return (
    <Panel title="Digest personale">
      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-600">
            <Sparkles size={14} />
            Oggi per te
          </div>

          <h3 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-white">
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
                className="rounded-2xl border border-white/[0.07] bg-black/25 p-3 text-sm leading-6 text-neutral-300"
              >
                {point}
              </div>
            ))}
          </div>
        )}

        {recommended.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <BookOpen size={15} />
              Da leggere
            </div>

            {recommended.map((item: any, index: number) => {
              const article = findArticle(item.id)

              return (
                <button
                  key={index}
                  onClick={() => article && openReader(article)}
                  disabled={!article}
                  className="w-full rounded-2xl bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="line-clamp-2 text-sm font-medium leading-5 text-white">
                    {item.title}
                  </div>

                  {item.reason && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">
                      {item.reason}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Panel>
  )
}