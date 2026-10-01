'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

import type { UpdateJob } from '@/lib/server/pipeline'
import { uniqueArticles } from '@/lib/articles/identity'

import type {
  AiPick,
  Article,
  Digest,
  SavedArticle,
  Section,
  Source,
  Topic,
} from './types'
import { ArticleFeedbackProvider, PreferencesPanel } from './article-feedback'
import type { Preference } from '@/lib/ai/preferences'
import { BackgroundGlow, EmptyState } from './ui'
import { Header, Sidebar } from './app-layout'
import { MobileNav } from './mobile-nav'
import { ReaderMode } from './reader-mode'
import { Metrics } from './metrics'
import { HeroPick, SidePick, AiSideList, AiCurationView } from './picks'
import { FeedList, SavedView } from './feed'
import { TrendingTopics, TopicView } from './topics'
import { SourcesPanel } from './sources'
import { Onboarding } from './onboarding'
import { FeedSkeleton, HeroSkeleton, MetricsSkeleton } from './skeletons'
import { SectorLinks, SectorView } from './sectors'
import { getSector } from '@/lib/sectors/catalog'
import { DigestPanel } from './digest'

export default function HomePage({ initialSector, initialSection = 'today' }: { initialSector?: string; initialSection?: Section } = {}) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>(initialSector ? 'sectors' : initialSection)
  function navigateSection(section: Section) {
    if (section === 'sectors') { router.push('/settori/ia'); return }
    if (initialSector) { router.push(`/?sezione=${section}`); return }
    setActiveSection(section)
  }
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [feedbackEntries, setFeedbackEntries] = useState<{ article_id: string; preference: Preference | null; title: string; source_name: string }[]>([])
  const preferences = useMemo(() => Object.fromEntries(feedbackEntries.map(entry => [entry.article_id, entry.preference])), [feedbackEntries])
  const [sources, setSources] = useState<Source[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [aiPicks, setAiPicks] = useState<AiPick[]>([])
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])
  const [trendingTopics, setTrendingTopics] = useState<Topic[]>([])
  const [digests, setDigests] = useState<Digest[]>([])
  const [query, setQuery] = useState('')
  const [archiveArticles, setArchiveArticles] = useState<Article[]>([])
  const [archiveTotal, setArchiveTotal] = useState(0)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('')
  const [period, setPeriod] = useState('all')
  const [updateStatus, setUpdateStatus] = useState('')

  const [expandingSources, setExpandingSources] = useState(false)
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [priority, setPriority] = useState(3)
  const [editingSource, setEditingSource] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [archiveVersion, setArchiveVersion] = useState(0)
  const [archiveNextOffset, setArchiveNextOffset] = useState(0)
  const refreshLock = useRef(false)
  const pollAbort = useRef<AbortController | null>(null)
  const archiveAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    loadEverything().then((job) => {
      if (job?.status === 'running') return watchUpdate(job)
    }).catch((error) => setLoadError(error instanceof Error ? error.message : 'Caricamento non disponibile')).finally(() => setLoading(false))
    const onFocus = () => { loadEverything().catch(() => setUpdateStatus('Dati non disponibili. Riprova.')) }
    window.addEventListener('focus', onFocus)
    return () => { window.removeEventListener('focus', onFocus); pollAbort.current?.abort(); archiveAbort.current?.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeSection !== 'feed') return
    const timer = window.setTimeout(() => {
      searchArchive().catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return
        setArchiveLoading(false)
        setUpdateStatus('Ricerca archivio non disponibile.')
      })
    }, 300)
    return () => { window.clearTimeout(timer); archiveAbort.current?.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, query, sourceFilter, period, archiveVersion])

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

  const validPicks = useMemo(
    () => aiPicks.filter((pick) => Boolean(pick.articles?.id && pick.articles.title)),
    [aiPicks],
  )
  const heroPick = validPicks[0]
  const sidePicks = validPicks.slice(1, 4)
  const lowerPicks = validPicks.slice(4, 10)

  const onboardingStep =
    sources.length === 0
      ? 'sources'
      : articles.length === 0
        ? 'refresh'
        : validPicks.length === 0
          ? 'ai'
          : null

  async function expandSources() {
    if (expandingSources) return
    setExpandingSources(true)
    setMessage('Controllo i feed prima di aggiungerli…')
    try {
      const response = await apiFetch('/api/sources/expand', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Verifica non disponibile')
      const skipped = data.reports.filter((report: { status: string }) => report.status === 'unavailable').length
      setMessage(`${data.added} nuove fonti verificate. ${skipped} candidate non importabili escluse. Aggiorna per importare le notizie.`)
      await loadEverything()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Verifica non disponibile')
    } finally {
      setExpandingSources(false)
    }
  }

  async function apiFetch(input: string, init: RequestInit = {}) {
    const response = await fetch(input, { ...init, cache: 'no-store' })
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
      feedback?: { article_id: string; preference: Preference | null; title: string; source_name: string }[]
      sources: Source[]
      articles: Article[]
      aiPicks: AiPick[]
      savedArticles: SavedArticle[]
      trendingTopics: Topic[]
      digests: Digest[]
      update: UpdateJob | null
    }
    setFeedbackEntries(data.feedback ?? [])
    setSources(data.sources)
    setArticles(data.articles)
    setAiPicks(data.aiPicks.filter((pick) => Boolean(pick.articles?.id && pick.articles.title)))
    setSavedArticles(data.savedArticles)
    setTrendingTopics(data.trendingTopics)
    setDigests(data.digests)
    setLoadError('')
    return data.update
  }

  async function searchArchive(offset = 0, append = false) {
    archiveAbort.current?.abort()
    const controller = new AbortController()
    archiveAbort.current = controller
    setArchiveLoading(true)
    try {
      const params = new URLSearchParams({ q: query, period, offset: String(offset) })
      if (sourceFilter) params.set('source', sourceFilter)
      const response = await apiFetch(`/api/articles?${params}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Ricerca non disponibile')
      const data = await response.json() as { articles: Article[]; total: number; nextOffset: number }
      if (controller.signal.aborted) return
      setArchiveArticles((current) => uniqueArticles(append ? [...current, ...data.articles] : data.articles))
      setArchiveTotal(data.total)
      setArchiveNextOffset(data.nextOffset)
    } finally {
      if (archiveAbort.current === controller) setArchiveLoading(false)
    }
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

  async function watchUpdate(initial: UpdateJob) {
    if (refreshLock.current) return
    refreshLock.current = true
    pollAbort.current?.abort()
    const controller = new AbortController()
    pollAbort.current = controller
    setRefreshing(true)
    let job = initial
    const deadline = Date.now() + 390_000
    const phases: Record<string, string> = { queued: 'Avvio', identity: 'Riconciliazione articoli', sources: 'Controllo fonti', profile: 'Aggiornamento interessi', picks: 'Selezione articoli', topics: 'Aggiornamento temi', digest: 'Preparazione riepilogo' }
    try {
      while (job.status === 'running') {
        if (Date.now() > deadline) throw new Error('Aggiornamento ancora in corso. Riapri la pagina per verificarne lo stato.')
        setUpdateStatus(`${phases[job.phase] ?? 'Aggiornamento'} in corso…`)
        await new Promise<void>((resolve, reject) => {
          const abort = () => { window.clearTimeout(timer); reject(new DOMException('Annullato', 'AbortError')) }
          const timer = window.setTimeout(() => { controller.signal.removeEventListener('abort', abort); resolve() }, 2_000)
          controller.signal.addEventListener('abort', abort, { once: true })
          if (controller.signal.aborted) abort()
        })
        const response = await apiFetch('/api/update-status', { signal: controller.signal })
        if (!response.ok) throw new Error('Stato aggiornamento non disponibile')
        const data = await response.json() as { job: UpdateJob | null }
        if (!data.job || data.job.id !== job.id) throw new Error('Aggiornamento sostituito: ricarica la pagina per verificarne lo stato.')
        job = data.job
      }
      await loadEverything()
      setArchiveVersion((version) => version + 1)
      const summary = job.result?.summary
      const selectionStatus = `${Math.max(0, (summary?.picksCount ?? 0) - (summary?.automaticPicks ?? 0))} scelte IA · ${summary?.automaticPicks ?? 0} automatiche`
      setUpdateStatus(job.status === 'failed' ? job.message || 'Aggiornamento non riuscito. Puoi riprovare.'
        : `${job.mode === 'ai' ? selectionStatus : `${summary?.newArticles ?? 0} nuovi articoli · ${summary?.updatedArticles ?? 0} aggiornati · ${summary?.sourcesOk ?? 0}/${summary?.sourcesChecked ?? 0} fonti operative · ${selectionStatus}`}${job.message ? ` · ${job.message}` : ''}`)
    } catch (error) {
      if (!controller.signal.aborted) setUpdateStatus(error instanceof Error ? error.message : 'Aggiornamento non disponibile')
    } finally { refreshLock.current = false; setRefreshing(false) }
  }

  async function runRefresh(mode: 'all' | 'ai') {
    if (refreshLock.current) return
    refreshLock.current = true
    setRefreshing(true)
    setUpdateStatus('Avvio aggiornamento…')
    try {
      const response = await apiFetch(mode === 'ai' ? '/api/update-ai' : '/api/update-now', { method: 'POST' })
      if (!response.ok) throw new Error('Aggiornamento non riuscito. Puoi riprovare.')
      const data = await response.json() as { job: UpdateJob }
      refreshLock.current = false
      await watchUpdate(data.job)
    } catch (error) {
      setUpdateStatus(error instanceof Error ? error.message : 'Aggiornamento non disponibile')
    } finally { refreshLock.current = false; setRefreshing(false) }
  }

  async function refreshData() { await runRefresh('all') }
  async function refreshAI() { await runRefresh('ai') }

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
      method: editingSource ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(editingSource ? { id: editingSource } : {}),
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
    setMessage(editingSource ? 'Fonte aggiornata.' : 'Fonte aggiunta.')
    setEditingSource(null)
    await loadEverything()
  }

  function editSource(source: Source) {
    setEditingSource(source.id); setName(source.name); setWebsiteUrl(source.website_url ?? ''); setRssUrl(source.rss_url); setPriority(source.priority); setMessage('')
  }
  function cancelEdit() { setEditingSource(null); setName(''); setWebsiteUrl(''); setRssUrl(''); setPriority(3) }

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

  if (loadError && !loading) return <main className="min-h-screen bg-[#070708] p-8 text-white"><p>{loadError}</p><button onClick={() => { setLoading(true); loadEverything().catch((error) => setLoadError(String(error))).finally(() => setLoading(false)) }}>Riprova</button></main>

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070708]">
        <div className="space-y-3">
          <div className="h-5 w-52 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 w-40 animate-pulse rounded-full bg-white/10" />
        </div>
      </main>
    )
  }

  return (
    <ArticleFeedbackProvider initial={preferences} onSaved={loadEverything}><main className="min-h-screen bg-[#070708] pb-32 text-neutral-100 xl:pb-0">
      <BackgroundGlow />

      <MobileNav activeSection={activeSection} setActiveSection={navigateSection} />

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

      <div className="relative mx-auto grid max-w-[1650px] grid-cols-1 xl:grid-cols-[260px_1fr]">
        <Sidebar activeSection={activeSection} setActiveSection={navigateSection} />

        <section className="min-w-0 px-3 py-4 sm:px-5 sm:py-6 xl:px-10 xl:py-9">
          <Header
            activeSection={activeSection}
            sectorTitle={initialSector ? getSector(initialSector)?.name : undefined}
            query={query}
            setQuery={setQuery}
            refreshData={refreshData}
            refreshAI={refreshAI}
            logout={logout}
            refreshing={refreshing}
            updateStatus={updateStatus}
            sources={sources}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            period={period}
            setPeriod={setPeriod}
          />

          {activeSection === 'sectors' && initialSector && <SectorView key={initialSector} slug={initialSector} query={query} source={sourceFilter} period={period} version={archiveVersion} savedIds={savedIds} toggleSave={toggleSave} openReader={openArticle} />}

          {activeSection === 'today' && (
            <>
              <div className="mb-6"><SectorLinks /></div>
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
                  aiPicks={validPicks}
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
                    subtitle="Ultime notizie da editori diversi. Tutti gli articoli sono disponibili nell’archivio."
                  />
                )}

                <aside className="space-y-5">
                  <PreferencesPanel entries={feedbackEntries} />
                  <DigestPanel
                    digest={digests[0]}
                    articles={[...articles, ...validPicks.flatMap((pick) => pick.articles ? [pick.articles] : [])]}
                    openReader={openArticle}
                  />

                  <TrendingTopics
                    topics={trendingTopics}
                    onSelect={openTopic}
                  />

                  <AiSideList picks={lowerPicks} savedIds={savedIds} toggleSave={toggleSave} openReader={openArticle} />

                  <SourcesPanel
                    sources={sources}
                    expandSources={expandSources}
                    expanding={expandingSources}
                    name={name}
                    setName={setName}
                    websiteUrl={websiteUrl}
                    setWebsiteUrl={setWebsiteUrl}
                    rssUrl={rssUrl}
                    setRssUrl={setRssUrl}
                    priority={priority}
                    setPriority={setPriority}
                    editing={Boolean(editingSource)}
              editSource={editSource}
              cancelEdit={cancelEdit}
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
            <>
              <FeedList
                articles={archiveArticles}
                savedIds={savedIds}
                toggleSave={toggleSave}
                openReader={openArticle}
                title="Archivio"
                subtitle={`${archiveTotal.toLocaleString('it-IT')} risultati nell’intero archivio.`}
              />
              {archiveArticles.length < archiveTotal && (
                <button disabled={archiveLoading} onClick={() => searchArchive(archiveNextOffset, true)} className="mt-5 w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm text-neutral-200 hover:bg-white/[0.07] disabled:opacity-50">
                  {archiveLoading ? 'Caricamento…' : 'Carica altri risultati'}
                </button>
              )}
            </>
          )}

          {activeSection === 'sources' && (
            <SourcesPanel
              full
              expandSources={expandSources}
              expanding={expandingSources}
              sources={sources}
              name={name}
              setName={setName}
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              rssUrl={rssUrl}
              setRssUrl={setRssUrl}
              priority={priority}
              setPriority={setPriority}
              editing={Boolean(editingSource)}
              editSource={editSource}
              cancelEdit={cancelEdit}
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
            <AiCurationView picks={validPicks} savedIds={savedIds} toggleSave={toggleSave} openReader={openArticle} />
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
    </main></ArticleFeedbackProvider>
  )
}
