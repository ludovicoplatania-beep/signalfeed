import { Flame } from 'lucide-react'
import { FeedList } from './feed'
import { Panel } from './ui'

export function TrendingTopics({ topics, onSelect }: { topics: any[]; onSelect: (topic: any) => void }) {
  if (!topics.length) return null

  return (
    <Panel title="Temi caldi">
      <div className="space-y-3">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic)}
            className="w-full rounded-2xl border border-white/[0.07] bg-black/25 p-4 text-left transition hover:bg-white/[0.05]"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Flame size={15} />
                {topic.title}
              </div>

              <div className="rounded-xl bg-white px-2 py-1 text-xs font-semibold text-black">
                {topic.score}
              </div>
            </div>

            {topic.description && (
              <p className="text-sm leading-6 text-neutral-500">
                {topic.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </Panel>
  )
}

export function TopicView({ topic, articles, savedIds, toggleSave, openReader }: any) {
  const topicArticleIds = Array.isArray(topic.articles) ? topic.articles : []

  const relatedArticles = articles.filter((article: any) =>
    topicArticleIds.includes(article.id)
  )

  return (
    <section>
      <div className="mb-8 rounded-[2rem] border border-white/[0.07] bg-white/[0.025] p-6 md:p-7">
        <div className="mb-3 flex items-center gap-2 text-sm text-neutral-400">
          <Flame size={16} />
          Tema caldo
        </div>

        <h2 className="text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
          {topic.title}
        </h2>

        {topic.description && (
          <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-400 md:text-lg md:leading-8">
            {topic.description}
          </p>
        )}

        <div className="mt-5 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-black">
          Score {topic.score}
        </div>
      </div>

      <FeedList
        articles={relatedArticles}
        savedIds={savedIds}
        toggleSave={toggleSave}
        openReader={openReader}
        title="Articoli collegati"
        subtitle="Notizie che compongono questo tema."
      />
    </section>
  )
}
