import { Flame } from 'lucide-react'
import { FeedList } from './feed'
import { Module, Panel, Score } from './ui'
import type { Article, OpenReader, ToggleSave, Topic } from './types'

export function TrendingTopics({ topics, onSelect }: { topics: Topic[]; onSelect: (topic: Topic) => void }) {
  if (!topics.length) return null

  return (
    <Panel title="Temi caldi">
      <div className="-m-3 divide-y divide-line">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic)}
            className="block w-full p-3 text-left transition hover:bg-background"
          >
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Flame size={14} aria-hidden="true" className="text-signal" />
                {topic.title}
              </div>
              <Score value={topic.score} />
            </div>

            {topic.description && (
              <p className="text-sm leading-6 text-muted">
                {topic.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </Panel>
  )
}

export function TopicView({
  topic,
  articles,
  savedIds,
  toggleSave,
  openReader,
}: {
  topic: Topic
  articles: Article[]
  savedIds: Set<string>
  toggleSave: ToggleSave
  openReader: OpenReader
}) {
  const topicArticleIds = Array.isArray(topic.articles) ? topic.articles : []

  const relatedArticles = articles.filter((article) =>
    topicArticleIds.includes(article.id)
  )

  return (
    <section>
      <Module label={<span className="flex items-center gap-2"><Flame size={13} aria-hidden="true" className="text-signal" />Tema caldo</span>} meta={`Score ${topic.score}`} className="mb-6">
        <div className="p-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {topic.title}
          </h2>

          {topic.description && (
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
              {topic.description}
            </p>
          )}
        </div>
      </Module>

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
