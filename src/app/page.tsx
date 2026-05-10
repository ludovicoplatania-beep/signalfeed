'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import {
  Bookmark,
  Clock,
  ExternalLink,
  LogOut,
  Newspaper,
  Plus,
  Power,
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
        loadSources(session.user.id)
        loadArticles()
        loadAiPicks(session.user.id)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const text = `${article.title} ${article.excerpt ?? ''} ${article.sources?.name ?? ''}`.toLowerCase()
      return text.includes(query.toLowerCase())
    })
  }, [articles, query])

  const heroPick = aiPicks[0]
  const secondaryPicks = aiPicks.slice(1, 5)
  const remainingPicks = aiPicks.slice(5)

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    setUserEmail(data.user?.email ?? null)
    setUserId(data.user?.id ?? null)

    if (data.user?.id) {
      await loadSources(data.user.id)
      await loadArticles()
      await loadAiPicks(data.user.id)
    }

    setLoading(false)
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
          published_at,
          sources ( name )
        )
      `)
      .eq('user_id', currentUserId)
      .order('score', { ascending: false })
      .limit(10)

    setAiPicks(data ?? [])
  }

  async function login() {
    setMessage('Invio link di accesso...')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    setMessage(error ? 'Errore: ' + error.message : 'Controlla la tua email e clicca il link di accesso.')
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
      setMessage('Errore: ' + error.message)
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
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-zinc-400">
        Caricamento SignalFeed...
      </main>
    )
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-[#070707] text-zinc-100">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
          <section className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950">
                  <Rss size={18} />
                </div>
                <div>
                  <div className="text-lg font-semibold">SignalFeed</div>
                  <div className="text-xs text-zinc-500">AI curated intelligence</div>
                </div>
              </div>

              <h1 className="max-w-3xl text-6xl font-semibold tracking-[-0.06em] text-zinc-50 md:text-8xl">
                La tua rassegna intelligente.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
                Tutte le fonti che contano, filtrate e ordinate da un sistema AI pensato per ridurre rumore e duplicati.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="mb-6">
                <div className="text-sm font-medium text-zinc-400">Accesso privato</div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Entra in SignalFeed</h2>
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/30"
              />

              <button
                onClick={login}
                className="mt-3 w-full rounded-2xl bg-zinc-100 px-4 py-4 font-semibold text-zinc-950 transition hover:bg-white"
              >
                Ricevi magic link
              </button>

              {message && <p className="mt-4 text-sm leading-6 text-zinc-400">{message}</p>}
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070707] text-zinc-100">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden min-h-screen border-r border-white/[0.08] px-5 py-6 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950">
              <Rss size={18} />
            </div>
            <div>
              <div className="font-semibold tracking-tight">SignalFeed</div>
              <div className="text-xs text-zinc-500">Daily signal, less noise</div>
            </div>
          </div>

          <nav className="space-y-1">
            <NavItem active icon={<Sparkles size={16} />} label="Oggi" />
            <NavItem icon={<Newspaper size={16} />} label="Feed" />
            <NavItem icon={<Bookmark size={16} />} label="Salvati" />
            <NavItem icon={<Rss size={16} />} label="Fonti" />
          </nav>

          <div className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Wand2 size={15} />
              Automazione
            </div>
            <p className="text-sm leading-6 text-zinc-500">
              Aggiornamento giornaliero automatico tramite Vercel Cron.
            </p>
          </div>
        </aside>

        <section className="px-5 py-6 md:px-10 md:py-10">
          <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <div className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-zinc-500">
                {new Date().toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-zinc-50 md:text-7xl">
                Il meglio delle tue fonti, già filtrato.
              </h1>

              <p className="mt-5 text-base leading-7 text-zinc-400">
                Accesso: {userEmail}
              </p>
            </div>

            <button
              onClick={logout}
              className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.08]"
            >
              <LogOut size={15} />
              Esci
            </button>
          </header>

          <section className="mb-10 grid gap-4 md:grid-cols-3">
            <Metric label="Fonti attive" value={sources.filter((s) => s.is_active).length} />
            <Metric label="Notizie raccolte" value={articles.length} />
            <Metric label="Selezioni AI" value={aiPicks.length} />
          </section>

          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-400">
                  <Sparkles size={16} />
                  Selezione AI
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">Da leggere prima</h2>
              </div>
            </div>

            {!heroPick ? (
              <EmptyState text="Nessuna selezione AI disponibile." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <a
                  href={heroPick.articles?.url}
                  target="_blank"
                  className="group relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.11),rgba(255,255,255,0.03)_42%,rgba(255,255,255,0.02))] p-7 shadow-2xl shadow-black/30"
                >
                  <div className="mb-10 flex items-center justify-between gap-4">
                    <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-400">
                      {heroPick.articles?.sources?.name ?? 'Fonte sconosciuta'} · {heroPick.category ?? 'Generale'}
                    </div>
                    <Score value={heroPick.score} />
                  </div>

                  <h3 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] group-hover:underline md:text-5xl">
                    {heroPick.articles?.title}
                  </h3>

                  <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                    {heroPick.summary}
                  </p>

                  <div className="mt-8 max-w-2xl rounded-3xl border border-white/[0.08] bg-black/25 p-5 text-sm leading-7 text-zinc-400">
                    <span className="font-medium text-zinc-100">Perché conta: </span>
                    {heroPick.reason}
                  </div>
                </a>

                <div className="grid gap-4">
                  {secondaryPicks.map((pick) => (
                    <SmallPick key={pick.id} pick={pick} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-10 xl:grid-cols-[1fr_380px]">
            <div>
              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Feed completo</h2>
                  <p className="mt-2 text-sm text-zinc-500">Tutti gli articoli importati dalle fonti attive.</p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
                  <Search size={16} className="text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cerca notizie..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="divide-y divide-white/[0.07] rounded-[2rem] border border-white/[0.08] bg-white/[0.025]">
                {filteredArticles.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    className="block p-5 transition hover:bg-white/[0.04]"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>{article.sources?.name ?? 'Fonte sconosciuta'}</span>
                      <span>•</span>
                      <Clock size={13} />
                      <span>
                        {article.published_at
                          ? new Date(article.published_at).toLocaleString('it-IT')
                          : 'Data non disponibile'}
                      </span>
                    </div>

                    <h3 className="text-xl font-medium leading-snug tracking-[-0.02em] text-zinc-100">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                        {article.excerpt}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>

            <aside className="space-y-5">
              <Panel title="Aggiungi fonte">
                <div className="space-y-3">
                  <Input value={name} setValue={setName} placeholder="Nome fonte" />
                  <Input value={websiteUrl} setValue={setWebsiteUrl} placeholder="Sito web" />
                  <Input value={rssUrl} setValue={setRssUrl} placeholder="URL RSS" />

                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-zinc-200 outline-none"
                  >
                    <option value={1}>Priorità 1</option>
                    <option value={2}>Priorità 2</option>
                    <option value={3}>Priorità 3</option>
                    <option value={4}>Priorità 4</option>
                    <option value={5}>Priorità 5</option>
                  </select>

                  <button
                    onClick={addSource}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
                  >
                    <Plus size={16} />
                    Salva fonte
                  </button>

                  {message && <p className="text-sm leading-6 text-zinc-500">{message}</p>}
                </div>
              </Panel>

              <Panel title="Fonti">
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div key={source.id} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{source.name}</div>
                          <div className="mt-1 text-xs text-zinc-600">Priorità {source.priority}</div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => toggleSource(source)} className="rounded-xl bg-white/[0.05] p-2">
                            <Power size={14} className={source.is_active ? 'text-emerald-400' : 'text-zinc-600'} />
                          </button>
                          <button onClick={() => deleteSource(source.id)} className="rounded-xl bg-white/[0.05] p-2">
                            <Trash2 size={14} className="text-zinc-500" />
                          </button>
                        </div>
                      </div>

                      {source.website_url && (
                        <a
                          href={source.website_url}
                          target="_blank"
                          className="mt-3 flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-300"
                        >
                          <ExternalLink size={12} />
                          Apri sito
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>

              {remainingPicks.length > 0 && (
                <Panel title="Altre scelte AI">
                  <div className="space-y-3">
                    {remainingPicks.map((pick) => (
                      <a key={pick.id} href={pick.articles?.url} target="_blank" className="block rounded-2xl bg-black/25 p-4 hover:bg-white/[0.04]">
                        <div className="mb-2 text-xs text-zinc-600">{pick.category}</div>
                        <div className="text-sm font-medium leading-5">{pick.articles?.title}</div>
                      </a>
                    ))}
                  </div>
                </Panel>
              )}
            </aside>
          </section>
        </section>
      </div>
    </main>
  )
}

function NavItem({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
      active ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
    }`}>
      {icon}
      {label}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.7rem] border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">{label}</div>
      <div className="mt-4 text-4xl font-semibold tracking-[-0.05em]">{value}</div>
    </div>
  )
}

function Score({ value }: { value: number }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-base font-semibold text-zinc-950">
      {value}
    </div>
  )
}

function SmallPick({ pick }: { pick: any }) {
  return (
    <a
      href={pick.articles?.url}
      target="_blank"
      className="rounded-[1.7rem] border border-white/[0.08] bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="text-xs text-zinc-600">
          {pick.articles?.sources?.name ?? 'Fonte'} · {pick.category ?? 'Generale'}
        </div>
        <Score value={pick.score} />
      </div>

      <h3 className="text-lg font-medium leading-snug tracking-[-0.02em]">{pick.articles?.title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-500">{pick.summary}</p>
    </a>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.7rem] border border-white/[0.08] bg-white/[0.025] p-5">
      <h3 className="mb-5 text-lg font-medium tracking-tight">{title}</h3>
      {children}
    </section>
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
      className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/20"
    />
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center text-zinc-500">
      {text}
    </div>
  )
}