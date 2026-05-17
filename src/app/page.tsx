'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clock3,
  ExternalLink,
  Flame,
  LogOut,
  Newspaper,
  Plus,
  Power,
  RefreshCcw,
  Rss,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'

type Section = 'today' | 'feed' | 'sources' | 'saved' | 'ai' | 'topic'

type Source = {
  id: string
  name: string
  website_url: string | null
  rss_url: string
  is_active: boolean
  priority: number
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<Section>('today')
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null)

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [sources, setSources] = useState<Source[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [aiPicks, setAiPicks] = useState<any[]>([])
  const [savedArticles, setSavedArticles] = useState<any[]>([])
  const [trendingTopics, setTrendingTopics] = useState<any[]>([])
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

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    setUserEmail(data.user?.email ?? null)
    setUserId(data.user?.id ?? null)

    if (data.user?.id) {
      await loadEverything(data.user.id)
    }

    setLoading(false)
  }

  async function loadEverything(currentUserId: string) {
    await Promise.all([
      loadSources(currentUserId),
      loadArticles(),
      loadAiPicks(currentUserId),
      loadSavedArticles(currentUserId),
      loadTrendingTopics(),
    ])
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

    setArticles(data ?? [])
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

    setAiPicks(data ?? [])
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

    setSavedArticles(data ?? [])
  }

  async function loadTrendingTopics() {
    const response = await fetch('/api/topics')
    const data = await response.json()
    setTrendingTopics(data.topics ?? [])
  }

  async function toggleSave(articleId?: string) {
    if (!userId || !articleId) return

    if (savedIds.has(articleId)) {
      await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId)
    } else {
      await supabase.from('saved_articles').insert({
        user_id: userId,
        article_id: articleId,
      })
    }

    await loadSavedArticles(userId)
  }

  async function refreshData() {
    if (!userId) return

    alert('Aggiornamento avviato. Attendi 30-60 secondi.')

    const response = await fetch('/api/update-now', {
      method: 'POST',
    })

    if (!response.ok) {
      alert('Errore durante aggiornamento.')
      return
    }

    await loadEverything(userId)
    alert('Aggiornamento completato.')
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
    await supabase.from('sources').update({ is_active: !source.is_active }).eq('id', source.id)
    await loadSources(userId)
  }

  async function deleteSource(sourceId: string) {
    if (!userId) return
    if (!confirm('Vuoi davvero eliminare questa fonte?')) return
    await supabase.from('sources').delete().eq('id', sourceId)
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
      <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
        <BackgroundGlow />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
          <section className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <Brand />

              <div className="mt-12 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-400">
                AI-curated news intelligence
              </div>

              <h1 className="mt-8 max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.08em] text-white md:text-8xl">
                Leggi meno.
                <br />
                Capisci di più.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">
                SignalFeed trasforma le tue fonti in una rassegna AI elegante, intelligente e senza rumore.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <p className="text-sm text-neutral-400">Accesso privato</p>
              <h2 className="mt-2 text-3xl font-medium tracking-tight">Entra nella tua rassegna</h2>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                className="mt-7 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
              />

              <button
                onClick={login}
                className="mt-3 w-full rounded-2xl bg-white px-4 py-4 font-medium text-black transition hover:bg-neutral-200"
              >
                Ricevi magic link
              </button>

              {message && <p className="mt-4 text-sm leading-6 text-neutral-400">{message}</p>}
            </motion.div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100">
      <BackgroundGlow />

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
        <aside className="hidden min-h-screen border-r border-white/[0.07] px-5 py-6 lg:block">
          <Brand />

          <nav className="mt-10 space-y-1">
            <NavItem active={activeSection === 'today'} icon={<Sparkles size={16} />} label="Today" onClick={() => setActiveSection('today')} />
            <NavItem active={activeSection === 'feed'} icon={<Newspaper size={16} />} label="Feed" onClick={() => setActiveSection('feed')} />
            <NavItem active={activeSection === 'sources'} icon={<Rss size={16} />} label="Sources" onClick={() => setActiveSection('sources')} />
            <NavItem active={activeSection === 'saved'} icon={<Bookmark size={16} />} label="Saved" onClick={() => setActiveSection('saved')} />
            <NavItem active={activeSection === 'ai'} icon={<Wand2 size={16} />} label="AI Curation" onClick={() => setActiveSection('ai')} />
          </nav>

          <div className="mt-10 rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4">
            <p className="text-sm font-medium">Daily automation</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              RSS + AI aggiornati automaticamente tramite Vercel Cron.
            </p>
          </div>
        </aside>

        <section className="px-5 py-6 md:px-10 md:py-9">
          <Header
            activeSection={activeSection}
            userEmail={userEmail}
            query={query}
            setQuery={setQuery}
            refreshData={refreshData}
            logout={logout}
          />

          {activeSection === 'today' && (
            <>
              <Metrics sources={sources} articles={articles} aiPicks={aiPicks} savedArticles={savedArticles} />

              {heroPick ? (
                <section className="mb-10 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <HeroPick
                    pick={heroPick}
                    saved={savedIds.has(heroPick.articles?.id)}
                    toggleSave={toggleSave}
                    openReader={setSelectedArticle}
                  />

                  <div className="grid gap-4">
                    {sidePicks.map((pick) => (
                      <SidePick
                        key={pick.id}
                        pick={pick}
                        saved={savedIds.has(pick.articles?.id)}
                        toggleSave={toggleSave}
                        openReader={setSelectedArticle}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <EmptyState text="Nessuna selezione AI disponibile." />
              )}

              <section className="grid gap-8 xl:grid-cols-[1fr_390px]">
                <FeedList
                  articles={filteredArticles}
                  savedIds={savedIds}
                  toggleSave={toggleSave}
                  openReader={setSelectedArticle}
                  title="Feed completo"
                  subtitle="Tutte le ultime notizie raccolte."
                />

                <aside className="space-y-5">
                  <TrendingTopics
                    topics={trendingTopics}
                    onSelect={(topic: any) => {
                      setSelectedTopic(topic)
                      setActiveSection('topic')
                    }}
                  />

                  <AiSideList picks={lowerPicks} savedIds={savedIds} toggleSave={toggleSave} openReader={setSelectedArticle} />

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
              openReader={setSelectedArticle}
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
            <SavedView savedArticles={savedArticles} toggleSave={toggleSave} openReader={setSelectedArticle} />
          )}

          {activeSection === 'ai' && (
            <AiCurationView picks={aiPicks} savedIds={savedIds} toggleSave={toggleSave} openReader={setSelectedArticle} />
          )}

          {activeSection === 'topic' && selectedTopic && (
            <TopicView
              topic={selectedTopic}
              articles={articles}
              savedIds={savedIds}
              toggleSave={toggleSave}
              openReader={setSelectedArticle}
            />
          )}
        </section>
      </div>
    </main>
  )
}

function ReaderMode({ article, saved, toggleSave, close }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#050505]/95 text-white backdrop-blur-xl"
    >
      <div className="mx-auto max-w-5xl px-5 py-6 md:px-10 md:py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={close}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.08]"
          >
            <ArrowLeft size={16} />
            Torna
          </button>

          <div className="flex gap-3">
            <SaveButton saved={saved} onClick={() => toggleSave(article.id)} />

            <a
              href={article.url}
              target="_blank"
              className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white px-4 py-3 text-sm font-medium text-black hover:bg-neutral-200"
            >
              <ExternalLink size={16} />
              Apri fonte originale
            </a>
          </div>
        </div>

        <article className="overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-white/[0.035]">
          <div className="relative h-[340px] overflow-hidden md:h-[460px]">
            <ArticleImage imageUrl={article.image_url} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>

          <div className="mx-auto max-w-3xl px-6 py-10 md:px-0 md:py-14">
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

            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.055em] md:text-6xl">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-8 text-xl leading-9 text-neutral-300">
                {article.excerpt}
              </p>
            )}

            {article.article_content ? (
              <div className="mt-10 whitespace-pre-line text-lg leading-9 text-neutral-300">
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

function Header({ activeSection, userEmail, query, setQuery, refreshData, logout }: any) {
  const titles: Record<Section, string> = {
    today: 'Il segnale migliore dalle tue fonti.',
    feed: 'Tutto il feed, ordinato.',
    sources: 'Gestisci le tue fonti.',
    saved: 'La tua reading list.',
    ai: 'Tutte le scelte AI.',
    topic: 'Tema caldo.',
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-9 flex flex-col justify-between gap-6 xl:flex-row xl:items-start"
    >
      <div>
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-neutral-500">
          {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        <h1 className="max-w-5xl text-5xl font-semibold leading-[0.94] tracking-[-0.075em] text-white md:text-7xl">
          {titles[activeSection as Section]}
        </h1>

        <p className="mt-5 text-sm text-neutral-500">{userEmail}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5">
          <Search size={15} className="text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca nel feed..."
            className="w-48 bg-transparent text-sm outline-none placeholder:text-neutral-600 md:w-64"
          />
        </div>

        <button onClick={refreshData} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.07]">
          <RefreshCcw size={15} />
          Aggiorna
        </button>

        <button onClick={logout} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.07]">
          <LogOut size={15} />
          Esci
        </button>
      </div>
    </motion.header>
  )
}

function Metrics({ sources, articles, aiPicks, savedArticles }: any) {
  return (
    <section className="mb-8 grid gap-4 md:grid-cols-4">
      <Metric label="Fonti attive" value={sources.filter((s: Source) => s.is_active).length} />
      <Metric label="Articoli raccolti" value={articles.length} />
      <Metric label="Scelte AI" value={aiPicks.length} />
      <Metric label="Salvati" value={savedArticles.length} />
    </section>
  )
}

function HeroPick({ pick, saved, toggleSave, openReader }: any) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative min-h-[560px] overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-neutral-900 shadow-2xl shadow-black/40"
    >
      <button onClick={() => openReader(pick.articles)} className="absolute inset-0 z-10 text-left">
        <ArticleImage imageUrl={pick.articles?.image_url} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
      </button>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-7 md:p-10">
        <div className="flex items-center justify-between">
          <Pill>{pick.articles?.sources?.name ?? 'Fonte'} · {pick.category}</Pill>

          <div className="pointer-events-auto flex items-center gap-3">
            <SaveButton saved={saved} onClick={() => toggleSave(pick.articles?.id)} />
            <Score value={pick.score} />
          </div>
        </div>

        <div>
          <p className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
            <Sparkles size={15} />
            Scelta principale
          </p>

          <button onClick={() => openReader(pick.articles)} className="pointer-events-auto text-left">
            <h2 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
              {pick.articles?.title}
            </h2>
          </button>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">{pick.summary}</p>
        </div>
      </div>
    </motion.div>
  )
}

function FeedList({ articles, savedIds, toggleSave, openReader, title, subtitle }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-5">
        <h2 className="text-3xl font-medium tracking-[-0.04em] text-white">{title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025]">
        {articles.length === 0 ? (
          <EmptyState text="Nessun articolo trovato." />
        ) : (
          articles.map((article: any, index: number) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.015 }}
              className="grid gap-4 border-b border-white/[0.06] p-5 transition last:border-b-0 hover:bg-white/[0.04] md:grid-cols-[112px_1fr_120px]"
            >
              <button onClick={() => openReader(article)} className="text-left">
                <ArticleThumbnail imageUrl={article.image_url} />
              </button>

              <button onClick={() => openReader(article)} className="text-left">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>{article.sources?.name ?? 'Fonte'}</span>
                  <span>•</span>
                  <Clock3 size={13} />
                  <span>
                    {article.published_at
                      ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })
                      : 'Adesso'}
                  </span>
                </div>

                <h3 className="text-xl font-medium leading-snug tracking-[-0.025em] text-neutral-100">
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-neutral-500">
                    {article.excerpt}
                  </p>
                )}
              </button>

              <div className="flex items-start justify-end">
                <SaveButton saved={savedIds.has(article.id)} onClick={() => toggleSave(article.id)} />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

function SavedView({ savedArticles, toggleSave, openReader }: any) {
  const articles = savedArticles.map((item: any) => item.articles).filter(Boolean)

  return (
    <FeedList
      articles={articles}
      savedIds={new Set(articles.map((a: any) => a.id))}
      toggleSave={toggleSave}
      openReader={openReader}
      title="Saved"
      subtitle="Articoli salvati per leggerli dopo."
    />
  )
}

function AiCurationView({ picks, savedIds, toggleSave, openReader }: any) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {picks.map((pick: any) => (
        <SidePick
          key={pick.id}
          pick={pick}
          saved={savedIds.has(pick.articles?.id)}
          toggleSave={toggleSave}
          openReader={openReader}
        />
      ))}
    </div>
  )
}

function AiSideList({ picks, savedIds, toggleSave, openReader }: any) {
  if (!picks.length) return null

  return (
    <Panel title="Altre scelte AI">
      <div className="space-y-3">
        {picks.map((pick: any) => (
          <div key={pick.id} className="grid grid-cols-[68px_1fr_auto] gap-3 rounded-2xl bg-black/25 p-3 hover:bg-white/[0.04]">
            <button onClick={() => openReader(pick.articles)} className="text-left">
              <ArticleThumbnail imageUrl={pick.articles?.image_url} compact />
            </button>

            <button onClick={() => openReader(pick.articles)} className="text-left">
              <div className="mb-1 text-xs text-neutral-600">{pick.category} · {pick.score}</div>
              <p className="line-clamp-3 text-sm font-medium leading-5 text-neutral-200">{pick.articles?.title}</p>
            </button>

            <SaveButton saved={savedIds.has(pick.articles?.id)} onClick={() => toggleSave(pick.articles?.id)} small />
          </div>
        ))}
      </div>
    </Panel>
  )
}

function TrendingTopics({ topics, onSelect }: { topics: any[]; onSelect: (topic: any) => void }) {
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

function TopicView({ topic, articles, savedIds, toggleSave, openReader }: any) {
  const topicArticleIds = Array.isArray(topic.articles) ? topic.articles : []

  const relatedArticles = articles.filter((article: any) =>
    topicArticleIds.includes(article.id)
  )

  return (
    <section>
      <div className="mb-8 rounded-[2rem] border border-white/[0.07] bg-white/[0.025] p-7">
        <div className="mb-3 flex items-center gap-2 text-sm text-neutral-400">
          <Flame size={16} />
          Tema caldo
        </div>

        <h2 className="text-5xl font-semibold tracking-[-0.06em] text-white">
          {topic.title}
        </h2>

        {topic.description && (
          <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-400">
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

function SidePick({ pick, saved, toggleSave, openReader }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35 }}
      className="group relative min-h-[170px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-neutral-900 p-5"
    >
      <button onClick={() => openReader(pick.articles)} className="absolute inset-0 text-left">
        <ArticleImage imageUrl={pick.articles?.image_url} />
        <div className="absolute inset-0 bg-black/68" />
      </button>

      <div className="relative pointer-events-none">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">{pick.articles?.sources?.name ?? 'Fonte'} · {pick.category}</p>

          <div className="pointer-events-auto flex items-center gap-3">
            <SaveButton saved={saved} onClick={() => toggleSave(pick.articles?.id)} small />
            <Score value={pick.score} />
          </div>
        </div>

        <button onClick={() => openReader(pick.articles)} className="pointer-events-auto text-left">
          <h3 className="text-xl font-medium leading-tight tracking-[-0.03em] group-hover:underline">
            {pick.articles?.title}
          </h3>
        </button>
      </div>
    </motion.div>
  )
}

function SaveButton({ saved, onClick, small = false }: any) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/45 text-sm font-medium text-white backdrop-blur transition hover:bg-white hover:text-black ${
        small ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      {!small && <span>{saved ? 'Salvato' : 'Salva'}</span>}
    </button>
  )
}

function SourcesPanel(props: any) {
  return (
    <div className={props.full ? 'grid gap-6 xl:grid-cols-[430px_1fr]' : 'space-y-5'}>
      <Panel title="Aggiungi fonte">
        <div className="space-y-3">
          <Input value={props.name} setValue={props.setName} placeholder="Nome fonte" />
          <Input value={props.websiteUrl} setValue={props.setWebsiteUrl} placeholder="Sito web" />
          <Input value={props.rssUrl} setValue={props.setRssUrl} placeholder="URL RSS" />

          <select
            value={props.priority}
            onChange={(e) => props.setPriority(Number(e.target.value))}
            className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none"
          >
            <option value={1}>Priorità 1</option>
            <option value={2}>Priorità 2</option>
            <option value={3}>Priorità 3</option>
            <option value={4}>Priorità 4</option>
            <option value={5}>Priorità 5</option>
          </select>

          <button
            onClick={props.addSource}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            <Plus size={16} />
            Salva fonte
          </button>

          {props.message && <p className="text-sm leading-6 text-neutral-500">{props.message}</p>}
        </div>
      </Panel>

      <Panel title="Fonti">
        <div className="space-y-3">
          {props.sources.map((source: Source) => (
            <div key={source.id} className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{source.name}</div>
                  <div className="mt-1 text-xs text-neutral-600">
                    Priorità {source.priority} · {source.is_active ? 'Attiva' : 'Disattivata'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => props.toggleSource(source)} className="rounded-xl bg-white/[0.05] p-2">
                    <Power size={14} className={source.is_active ? 'text-emerald-400' : 'text-neutral-600'} />
                  </button>

                  <button onClick={() => props.deleteSource(source.id)} className="rounded-xl bg-white/[0.05] p-2">
                    <Trash2 size={14} className="text-neutral-500" />
                  </button>
                </div>
              </div>

              {source.website_url && (
                <a href={source.website_url} target="_blank" className="mt-3 flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-300">
                  <ExternalLink size={12} />
                  Apri sito
                </a>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function BackgroundGlow() {
  return (
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(120,119,198,0.16),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(20,184,166,0.08),transparent_26%)]" />
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
        <Rss size={18} />
      </div>
      <div>
        <div className="font-medium tracking-tight text-white">SignalFeed</div>
        <div className="text-xs text-neutral-500">AI curated news</div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active = false, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
        active ? 'bg-white text-black' : 'text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="flex min-h-[145px] flex-col justify-between rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-5"
    >
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-600">{label}</div>
      <div className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-white">{value}</div>
    </motion.div>
  )
}

function Score({ value }: { value: number }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-base font-semibold text-black">
      {value}
    </div>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs text-neutral-300 backdrop-blur">
      {children}
    </div>
  )
}

function ArticleImage({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
    )
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/50 via-fuchsia-500/20 to-orange-400/30" />
  )
}

function ArticleThumbnail({ imageUrl, compact = false }: { imageUrl?: string | null; compact?: boolean }) {
  const size = compact ? 'h-16' : 'h-24'

  if (imageUrl) {
    return <img src={imageUrl} alt="" className={`hidden ${size} w-full rounded-2xl object-cover md:block`} />
  }

  return <div className={`hidden ${size} rounded-2xl bg-gradient-to-br from-indigo-400/45 to-fuchsia-400/20 md:block`} />
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-5">
      <h3 className="mb-5 text-lg font-medium tracking-tight text-white">{title}</h3>
      {children}
    </div>
  )
}

function Input({ value, setValue, placeholder }: { value: string; setValue: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-white/20"
    />
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center text-neutral-500">
      {text}
    </div>
  )
}