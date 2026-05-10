'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

import {
  Bookmark,
  Clock3,
  ExternalLink,
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

type Source = {
  id: string
  name: string
  website_url: string | null
  rss_url: string
  is_active: boolean
  priority: number
}

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)

  const [sources, setSources] = useState<Source[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [aiPicks, setAiPicks] = useState<any[]>([])

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

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const text =
        `${article.title} ${article.excerpt ?? ''} ${article.sources?.name ?? ''}`.toLowerCase()

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
        published_at,
        sources ( name )
      `)
      .order('published_at', { ascending: false })
      .limit(80)

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
          title,
          url,
          image_url,
          published_at,
          sources ( name )
        )
      `)
      .eq('user_id', currentUserId)
      .order('score', { ascending: false })
      .limit(10)

    setAiPicks(data ?? [])
  }

  async function refreshData() {
    if (!userId) return

    setMessage('Aggiornamento dashboard...')
    await loadEverything(userId)
    setMessage('Dashboard aggiornata.')
  }

  async function login() {
    setMessage('Invio magic link...')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setMessage(
      error
        ? 'Errore: ' + error.message
        : 'Controlla la tua email e clicca il magic link.'
    )
  }

  async function logout() {
    await supabase.auth.signOut()
    setUserEmail(null)
    setUserId(null)
  }

  async function addSource() {
    if (!userId) return

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

    await loadSources(userId)
  }

  async function toggleSource(source: Source) {
    if (!userId) return

    await supabase
      .from('sources')
      .update({
        is_active: !source.is_active,
      })
      .eq('id', source.id)

    await loadSources(userId)
  }

  async function deleteSource(sourceId: string) {
    if (!userId) return

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
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
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
                SignalFeed trasforma le tue fonti in una rassegna AI elegante,
                intelligente e senza rumore.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <div className="mb-7">
                <p className="text-sm text-neutral-400">Accesso privato</p>

                <h2 className="mt-2 text-3xl font-medium tracking-tight">
                  Entra nella tua rassegna
                </h2>
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
              />

              <button
                onClick={login}
                className="mt-3 w-full rounded-2xl bg-white px-4 py-4 font-medium text-black transition hover:bg-neutral-200"
              >
                Ricevi magic link
              </button>

              {message && (
                <p className="mt-4 text-sm leading-6 text-neutral-400">
                  {message}
                </p>
              )}
            </motion.div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100">
      <BackgroundGlow />

      <div className="relative mx-auto grid max-w-[1650px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden min-h-screen border-r border-white/[0.07] px-5 py-6 lg:block">
          <Brand />

          <nav className="mt-10 space-y-1">
            <NavItem active icon={<Sparkles size={16} />} label="Today" />
            <NavItem icon={<Newspaper size={16} />} label="Feed" />
            <NavItem icon={<Rss size={16} />} label="Sources" />
            <NavItem icon={<Bookmark size={16} />} label="Saved" />
            <NavItem icon={<Wand2 size={16} />} label="AI Curation" />
          </nav>

          <div className="mt-10 rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4">
            <p className="text-sm font-medium">Daily automation</p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              RSS + AI aggiornati automaticamente tramite Vercel Cron.
            </p>
          </div>
        </aside>

        <section className="px-5 py-6 md:px-10 md:py-9">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-9 flex flex-col justify-between gap-6 xl:flex-row xl:items-start"
          >
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-neutral-500">
                {new Date().toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>

              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.94] tracking-[-0.075em] text-white md:text-7xl">
                Il segnale migliore dalle tue fonti.
              </h1>

              <p className="mt-5 text-sm text-neutral-500">
                {userEmail}
              </p>
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

              <button
                onClick={refreshData}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.07]"
              >
                <RefreshCcw size={15} />
                Aggiorna
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.07]"
              >
                <LogOut size={15} />
                Esci
              </button>
            </div>
          </motion.header>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 grid gap-4 md:grid-cols-3"
          >
            <Metric label="Fonti attive" value={sources.filter((s) => s.is_active).length} />
            <Metric label="Articoli raccolti" value={articles.length} />
            <Metric label="Scelte AI" value={aiPicks.length} />
          </motion.section>

          {heroPick && (
            <motion.section
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85 }}
              className="mb-10 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
            >
              <motion.a
                href={heroPick.articles?.url}
                target="_blank"
                whileHover={{ y: -4 }}
                className="group relative min-h-[560px] overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-neutral-900 shadow-2xl shadow-black/40"
              >
                <ArticleImage imageUrl={heroPick.articles?.image_url} />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />

                <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-10">
                  <div className="flex items-center justify-between">
                    <Pill>
                      {heroPick.articles?.sources?.name ?? 'Fonte'} · {heroPick.category}
                    </Pill>

                    <Score value={heroPick.score} />
                  </div>

                  <div>
                    <p className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
                      <Sparkles size={15} />
                      Scelta principale
                    </p>

                    <h2 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
                      {heroPick.articles?.title}
                    </h2>

                    <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
                      {heroPick.summary}
                    </p>
                  </div>
                </div>
              </motion.a>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
                className="grid gap-4"
              >
                {sidePicks.map((pick) => (
                  <SidePick key={pick.id} pick={pick} />
                ))}
              </motion.div>
            </motion.section>
          )}

          <section className="grid gap-8 xl:grid-cols-[1fr_390px]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-5">
                <h2 className="text-3xl font-medium tracking-[-0.04em] text-white">
                  Feed completo
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Tutte le ultime notizie raccolte.
                </p>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025]">
                {filteredArticles.map((article, index) => (
                  <motion.a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                    className="grid gap-4 border-b border-white/[0.06] p-5 transition last:border-b-0 md:grid-cols-[112px_1fr]"
                  >
                    <ArticleThumbnail
                      imageUrl={article.image_url}
                    />

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span>
                          {article.sources?.name ?? 'Fonte'}
                        </span>

                        <span>•</span>

                        <Clock3 size={13} />

                        <span>
                          {article.published_at
                            ? formatDistanceToNow(
                                new Date(article.published_at),
                                {
                                  addSuffix: true,
                                  locale: it,
                                }
                              )
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
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-5"
            >
              {lowerPicks.length > 0 && (
                <Panel title="Altre scelte AI">
                  <div className="space-y-3">
                    {lowerPicks.map((pick) => (
                      <motion.a
                        key={pick.id}
                        href={pick.articles?.url}
                        target="_blank"
                        whileHover={{ y: -2 }}
                        className="grid grid-cols-[68px_1fr] gap-3 rounded-2xl bg-black/25 p-3 hover:bg-white/[0.04]"
                      >
                        <ArticleThumbnail
                          imageUrl={pick.articles?.image_url}
                          compact
                        />

                        <div>
                          <div className="mb-1 text-xs text-neutral-600">
                            {pick.category} · {pick.score}
                          </div>

                          <p className="line-clamp-3 text-sm font-medium leading-5 text-neutral-200">
                            {pick.articles?.title}
                          </p>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </Panel>
              )}

              <Panel title="Aggiungi fonte">
                <div className="space-y-3">
                  <Input value={name} setValue={setName} placeholder="Nome fonte" />
                  <Input value={websiteUrl} setValue={setWebsiteUrl} placeholder="Sito web" />
                  <Input value={rssUrl} setValue={setRssUrl} placeholder="URL RSS" />

                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none"
                  >
                    <option value={1}>Priorità 1</option>
                    <option value={2}>Priorità 2</option>
                    <option value={3}>Priorità 3</option>
                    <option value={4}>Priorità 4</option>
                    <option value={5}>Priorità 5</option>
                  </select>

                  <button
                    onClick={addSource}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
                  >
                    <Plus size={16} />
                    Salva fonte
                  </button>
                </div>
              </Panel>
            </motion.aside>
          </section>
        </section>
      </div>
    </main>
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
        <div className="font-medium tracking-tight text-white">
          SignalFeed
        </div>

        <div className="text-xs text-neutral-500">
          AI curated news
        </div>
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode
  label: string
  active?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
        active
          ? 'bg-white text-black'
          : 'text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300'
      }`}
    >
      {icon}
      {label}
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-5"
    >
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-600">
        {label}
      </div>

      <div className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-white">
        {value}
      </div>
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

function ArticleImage({
  imageUrl,
}: {
  imageUrl?: string | null
}) {
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

function ArticleThumbnail({
  imageUrl,
  compact = false,
}: {
  imageUrl?: string | null
  compact?: boolean
}) {
  const size = compact ? 'h-16' : 'h-24'

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`hidden ${size} w-full rounded-2xl object-cover md:block`}
      />
    )
  }

  return (
    <div
      className={`hidden ${size} rounded-2xl bg-gradient-to-br from-indigo-400/45 to-fuchsia-400/20 md:block`}
    />
  )
}

function SidePick({ pick }: { pick: any }) {
  return (
    <motion.a
      href={pick.articles?.url}
      target="_blank"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35 }}
      className="group relative min-h-[170px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-neutral-900 p-5"
    >
      <ArticleImage imageUrl={pick.articles?.image_url} />

      <div className="absolute inset-0 bg-black/68" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">
            {pick.articles?.sources?.name ?? 'Fonte'} · {pick.category}
          </p>

          <Score value={pick.score} />
        </div>

        <h3 className="text-xl font-medium leading-tight tracking-[-0.03em] group-hover:underline">
          {pick.articles?.title}
        </h3>
      </div>
    </motion.a>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-5">
      <h3 className="mb-5 text-lg font-medium tracking-tight text-white">
        {title}
      </h3>

      {children}
    </div>
  )
}

function Input({
  value,
  setValue,
  placeholder,
}: {
  value: string
  setValue: (value: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-white/20"
    />
  )
}