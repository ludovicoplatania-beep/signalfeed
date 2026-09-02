'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AnimatePresence } from 'framer-motion'

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
import { LoginView } from './components/login-view'
import { Onboarding } from './components/onboarding'
import { FeedSkeleton, HeroSkeleton, MetricsSkeleton } from './components/skeletons'
import { DigestPanel } from './components/digest'

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<Section>('today')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
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
    checkUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      setUserId(session?.user?.id ?? null)

      if (session?.user?.id) {
        loadEverything(session.user.id)
      }
    })

    return () => listener.subscription.unsubscribe()
    // This subscription is intentionally installed once; callbacks read the session supplied by Supabase.
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

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    setUserEmail(data.user?.email ?? null)
    setUserId(data.user?.id ?? null)

    if (data.user?.id) await loadEverything(data.user.id)

    setLoading(false)
  }

  async function loadEverything(currentUserId: string) {
    await Promise.all([
      loadSources(currentUserId),
      loadArticles(),
      loadAiPicks(currentUserId),
      loadSavedArticles(currentUserId),
      loadTrendingTopics(),
      loadDigests(currentUserId),
    ])
  }

  async function authorizedFetch(input: string, init: RequestInit = {}) {
    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token
    if (!accessToken) throw new Error('Sessione scaduta')

    return fetch(input, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  async function loadSources(currentUserId: string) {
    const { data } = await supabase
      .from('sources')
      .select('id, name, website_url, rss_url, is_active, priority')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })

    setSources(data ?? [])
  }

  async function loadArticles() {
    const { data } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        url,
        excerpt,
        image_url,
        article_content,
        published_at,
        sources ( name )
      `)
      .order('published_at', { ascending: false })
      .limit(100)

    setArticles((data ?? []).map(({ sources: relatedSources, ...article }) => ({
      ...article,
      sources: relatedSources?.[0] ?? null,
    })) as Article[])
  }

  async function loadAiPicks(currentUserId: string) {
    const { data } = await supabase
      .from('ai_picks')
      .select(`
        id,
        score,
        summary,
        reason,
        category,
        created_at,
        articles (
          id,
          title,
          url,
          excerpt,
          image_url,
          article_content,
          published_at,
          sources ( name )
        )
      `)
      .eq('user_id', currentUserId)
      .order('score', { ascending: false })
      .limit(20)

    setAiPicks((data ?? []).map(({ articles: relatedArticles, ...pick }) => {
      const article = relatedArticles?.[0]
      return {
        ...pick,
        articles: article
          ? { ...article, sources: article.sources?.[0] ?? null }
          : null,
      }
    }) as AiPick[])
  }

  async function loadSavedArticles(currentUserId: string) {
    const { data } = await supabase
      .from('saved_articles')
      .select(`
        id,
        article_id,
        created_at,
        articles (
          id,
          title,
          url,
          excerpt,
          image_url,
          article_content,
          published_at,
          sources ( name )
        )
      `)
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })

    setSavedArticles((data ?? []).map(({ articles: relatedArticles, ...saved }) => {
      const article = relatedArticles?.[0]
      return {
        ...saved,
        articles: article
          ? { ...article, sources: article.sources?.[0] ?? null }
          : null,
      }
    }) as SavedArticle[])
  }

  async function loadTrendingTopics() {
    const response = await authorizedFetch('/api/topics')
    if (!response.ok) return
    const data = await response.json()
    setTrendingTopics(data.topics ?? [])
  }

  async function loadDigests(currentUserId: string) {
    const { data } = await supabase
      .from('daily_digests')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(1)

    setDigests(data ?? [])
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
    if (!userId) return

    await authorizedFetch('/api/track', {
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
    if (!userId || !articleId) return

    if (savedIds.has(articleId)) {
      await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId)

      await trackEvent({
        event_type: 'article_unsaved',
        article_id: articleId,
      })
    } else {
      await supabase.from('saved_articles').insert({
        user_id: userId,
        article_id: articleId,
      })

      await trackEvent({
        event_type: 'article_saved',
        article_id: articleId,
      })
    }

    await loadSavedArticles(userId)
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
    if (!userId) return

    setRefreshing(true)

    const response = await authorizedFetch('/api/update-now', {
      method: 'POST',
    })

    if (!response.ok) {
      alert('Errore durante aggiornamento.')
      setRefreshing(false)
      return
    }

    await loadEverything(userId)
    setRefreshing(false)
  }

  async function login() {
    setMessage('Invio magic link...')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    setMessage(error ? 'Errore: ' + error.message : 'Controlla la tua email e clicca il magic link.')
  }

  async function logout() {
    await supabase.auth.signOut()
    setUserEmail(null)
    setUserId(null)
  }

  async function addSource() {
    if (!userId) return

    if (!name || !rssUrl) {
      setMessage('Inserisci almeno nome fonte e URL RSS.')
      return
    }

    const { error } = await supabase.from('sources').insert({
      user_id: userId,
      name,
      website_url: websiteUrl || null,
      rss_url: rssUrl,
      priority,
      is_active: true,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setName('')
    setWebsiteUrl('')
    setRssUrl('')
    setPriority(3)
    setMessage('Fonte aggiunta.')
    await loadSources(userId)
  }

  async function toggleSource(source: Source) {
    if (!userId) return
    await supabase
      .from('sources')
      .update({ is_active: !source.is_active })
      .eq('id', source.id)
      .eq('user_id', userId)
    await loadSources(userId)
  }

  async function deleteSource(sourceId: string) {
    if (!userId) return
    if (!confirm('Vuoi davvero eliminare questa fonte?')) return
    await supabase.from('sources').delete().eq('id', sourceId).eq('user_id', userId)
    await loadSources(userId)
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

  if (!userEmail) {
    return (
      <LoginView
        email={email}
        setEmail={setEmail}
        message={message}
        login={login}
      />
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
