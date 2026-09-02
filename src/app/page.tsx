'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

import type {
  AiPick,
  Article,
  Digest,
  SavedArticle,
  Section,
  Source,
  Topic,
} from './components/types'
import { BackgroundGlow, EmptyState } from './components/ui'
import { Header, Sidebar } from './components/app-layout'
import { MobileNav } from './components/mobile-nav'
import { ReaderMode } from './components/reader-mode'
import { Metrics } from './components/metrics'
import { HeroPick, SidePick, AiSideList, AiCurationView } from './components/picks'
import { FeedList, SavedView } from './components/feed'
import { TrendingTopics, TopicView } from './components/topics'
import { SourcesPanel } from './components/sources'
import { Onboarding } from './components/onboarding'
import { FeedSkeleton, HeroSkeleton, MetricsSkeleton } from './components/skeletons'
import { DigestPanel } from './components/digest'

export default function HomePage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('today')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [sources, setSources] = useState<Source[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [aiPicks, setAiPicks] = useState<AiPick[]>([])
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])
  const [trendingTopics, setTrendingTopics] = useState<Topic[]>([])
  const [digests, setDigests] = useState<Digest[]>([])
  const [query, setQuery] = useState('')

  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [priority, setPriority] = useState(3)

  useEffect(() => {
    loadEverything().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const savedIds = useMemo(
    () => new Set(savedArticles.map((item) => item.article_id)),
    [savedArticles]
  )

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const text = `${article.title} ${article.excerpt ?? ''} ${article.sources?.name ?? ''}`.toLowerCase()
      return text.includes(query.toLowerCase())
    })
  }, [articles, query])

  const heroPick = aiPicks[0]
  const sidePicks = aiPicks.slice(1, 4)
  const lowerPicks = aiPicks.slice(4, 10)

  const onboardingStep =
    sources.length === 0
      ? 'sources'
      : articles.length === 0
        ? 'refresh'
        : aiPicks.length === 0
          ? 'ai'
          : null

  async function apiFetch(input: string, init: RequestInit = {}) {
    const response = await fetch(input, init)
    if (response.status === 401) {
      router.replace('/access')
      throw new Error('Accesso scaduto')
    }
    return response
  }

  async function loadEverything() {
    const response = await apiFetch('/api/data')
    if (!response.ok) throw new Error('Impossibile caricare i dati')
    const data = await response.json() as {
      sources: Source[]
      articles: Article[]
      aiPicks: AiPick[]
      savedArticles: SavedArticle[]
      trendingTopics: Topic[]
      digests: Digest[]
    }
    setSources(data.sources)
    setArticles(data.articles)
    setAiPicks(data.aiPicks)
    setSavedArticles(data.savedArticles)
    setTrendingTopics(data.trendingTopics)
    setDigests(data.digests)
  }

  async function trackEvent({
    event_type,
    article_id,
    topic_id,
    metadata,
  }: {
    event_type: string
    article_id?: string
    topic_id?: string
    metadata?: Record<string, string | number | boolean | null>
  }) {
    await apiFetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type,
        article_id,
        topic_id,
        metadata,
      }),
    })
  }

  async function toggleSave(articleId?: string) {
    if (!articleId) return

    if (savedIds.has(articleId)) {
      await apiFetch('/api/saved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      })

      await trackEvent({
        event_type: 'article_unsaved',
        article_id: articleId,
      })
    } else {
      await apiFetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      })

      await trackEvent({
        event_type: 'article_saved',
        article_id: articleId,
      })
    }

    await loadEverything()
  }

  async function openArticle(article: Article) {
    setSelectedArticle(article)

    await trackEvent({
      event_type: 'article_opened',
      article_id: article.id,
      metadata: {
        title: article.title,
        source: article.sources?.name ?? null,
      },
    })
  }

  async function openTopic(topic: Topic) {
    setSelectedTopic(topic)
    setActiveSection('topic')

    await trackEvent({
      event_type: 'topic_opened',
      topic_id: topic.id,
      metadata: {
        title: topic.title,
        score: topic.score,
      },
    })
  }

  async function refreshData() {
    setRefreshing(true)

    const response = await apiFetch('/api/update-now', {
      method: 'POST',
    })

    if (!response.ok) {
      alert('Errore durante aggiornamento.')
      setRefreshing(false)
      return
    }

    await loadEverything()
    setRefreshing(false)
  }

  async function logout() {
    await fetch('/api/access/logout', { method: 'POST' })
    router.replace('/access')
  }

  async function addSource() {
    if (!name || !rssUrl) {
      setMessage('Inserisci almeno nome fonte e URL RSS.')
      return
    }

    const response = await apiFetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        website_url: websiteUrl || null,
        rss_url: rssUrl,
        priority,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      setMessage(data.message ?? 'Impossibile aggiungere la fonte.')
      return
    }

    setName('')
    setWebsiteUrl('')
    setRssUrl('')
    setPriority(3)
    setMessage('Fonte aggiunta.')
    await loadEverything()
  }

  async function toggleSource(source: Source) {
    await apiFetch('/api/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: source.id, is_active: !source.is_active }),
    })
    await loadEverything()
  }

  async function deleteSource(sourceId: string) {
    if (!confirm('Vuoi davvero eliminare questa fonte?')) return
    await apiFetch('/api/sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sourceId }),
    })
    await loadEverything()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="space-y-3">
          <div className="h-5 w-52 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 w-40 animate-pulse rounded-full bg-white/10" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] pb-28 text-neutral-100 lg:pb-0">
      <BackgroundGlow />

      <MobileNav activeSection={activeSection} setActiveSection={setActiveSection} />

      <AnimatePresence>
        {selectedArticle && (
          <ReaderMode
            article={selectedArticle}
            saved={savedIds.has(selectedArticle.id)}
            toggleSave={toggleSave}
            close={() => setSelectedArticle(null)}
          />
        )}
      </AnimatePresence>

      <div className="relative mx-auto grid max-w-[1650px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        <section className="px-4 py-5 md:px-10 md:py-9">
          <Header
            activeSection={activeSection}
            query={query}
            setQuery={setQuery}
            refreshData={refreshData}
            logout={logout}
          />

          {activeSection === 'today' && (
            <>
              {onboardingStep && (
                <Onboarding
                  step={onboardingStep}
                  goToSources={() => setActiveSection('sources')}
                  refreshData={refreshData}
                />
              )}

              {refreshing ? (
                <MetricsSkeleton />
              ) : (
                <Metrics
                  sources={sources}
                  articles={articles}
                  aiPicks={aiPicks}
                  savedArticles={savedArticles}
                />
              )}

              {refreshing ? (
                <HeroSkeleton />
              ) : heroPick ? (
                <section className="mb-10 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <HeroPick
                    pick={heroPick}
                    saved={heroPick.articles ? savedIds.has(heroPick.articles.id) : false}
                    toggleSave={toggleSave}
                    openReader={openArticle}
                  />

                  <div className="grid gap-4">
                    {sidePicks.map((pick) => (
                      <SidePick
                        key={pick.id}
                        pick={pick}
                        saved={pick.articles ? savedIds.has(pick.articles.id) : false}
                        toggleSave={toggleSave}
                        openReader={openArticle}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <EmptyState text="Nessuna selezione AI disponibile." />
              )}

              <section className="grid gap-8 xl:grid-cols-[1fr_390px]">
                {refreshing ? (
                  <FeedSkeleton />
                ) : (
                  <FeedList
                    articles={filteredArticles}
                    savedIds={savedIds}
                    toggleSave={toggleSave}
                    openReader={openArticle}
                    title="Feed completo"
                    subtitle="Tutte le ultime notizie raccolte."
                  />
                )}

                <aside className="space-y-5">
                  <DigestPanel
                    digest={digests[0]}
                    articles={articles}
                    openReader={openArticle}
                  />

                  <TrendingTopics
                    topics={trendingTopics}
                    onSelect={openTopic}
                  />

                  <AiSideList picks={lowerPicks} savedIds={savedIds} toggleSave={toggleSave} openReader={openArticle} />

                  <SourcesPanel
                    sources={sources}
                    name={name}
                    setName={setName}
                    websiteUrl={websiteUrl}
                    setWebsiteUrl={setWebsiteUrl}
                    rssUrl={rssUrl}
                    setRssUrl={setRssUrl}
                    priority={priority}
                    setPriority={setPriority}
                    addSource={addSource}
                    toggleSource={toggleSource}
                    deleteSource={deleteSource}
                    message={message}
                  />
                </aside>
              </section>
            </>
          )}

          {activeSection === 'feed' && (
            <FeedList
              articles={filteredArticles}
              savedIds={savedIds}
              toggleSave={toggleSave}
              openReader={openArticle}
              title="Feed"
              subtitle="Tutte le notizie importate dalle tue fonti."
            />
          )}

          {activeSection === 'sources' && (
            <SourcesPanel
              full
              sources={sources}
              name={name}
              setName={setName}
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              rssUrl={rssUrl}
              setRssUrl={setRssUrl}
              priority={priority}
              setPriority={setPriority}
              addSource={addSource}
              toggleSource={toggleSource}
              deleteSource={deleteSource}
              message={message}
            />
          )}

          {activeSection === 'saved' && (
            <SavedView savedArticles={savedArticles} toggleSave={toggleSave} openReader={openArticle} />
          )}

          {activeSection === 'ai' && (
            <AiCurationView picks={aiPicks} savedIds={savedIds} toggleSave={toggleSave} openReader={openArticle} />
          )}

          {activeSection === 'topic' && selectedTopic && (
            <TopicView
              topic={selectedTopic}
              articles={articles}
              savedIds={savedIds}
              toggleSave={toggleSave}
              openReader={openArticle}
            />
          )}
        </section>
      </div>
    </main>
  )
}
