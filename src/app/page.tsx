'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import {
  Bookmark,
  Clock,
  ExternalLink,
  LogOut,
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
  const sidePicks = aiPicks.slice(1, 4)
  const lowerPicks = aiPicks.slice(4, 10)

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
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-neutral-400">
        Caricamento SignalFeed...
      </main>
    )
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(120,119,198,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.10),transparent_30%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
          <section className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Brand />
              <h1 className="mt-12 max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.07em] text-white md:text-8xl">
                News intelligence, senza rumore.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">
                Raccogli le fonti che contano, lascia che l’AI selezioni il segnale e leggi solo ciò che merita davvero attenzione.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="mb-7">
                <p className="text-sm text-neutral-400">Accesso privato</p>
                <h2 className="mt-2 text-3xl font-medium tracking-tight">Entra nella tua rassegna</h2>
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
              />

              <button onClick={login} className="mt-3 w-full rounded-2xl bg-white px-4 py-4 font-medium text-black transition hover:bg-neutral-200">
                Ricevi magic link
              </button>

              {message && <p className="mt-4 text-sm leading-6 text-neutral-400">{message}</p>}
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(120,119,198,0.16),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(20,184,166,0.08),transparent_26%)]" />

      <div className="relative mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden min-h-screen border-r border-white/[0.07] px-5 py-6 lg:block">
          <Brand />

          <nav className="mt-10 space-y-1">
            <NavItem active icon={<Sparkles size={16} />} label="Today" />
            <NavItem icon={<Rss size={16} />} label="Sources" />
            <NavItem icon={<Bookmark size={16} />} label="Saved" />
            <NavItem icon={<Wand2 size={16} />} label="AI Curation" />
          </nav>

          <div className="mt-10 rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4">
            <p className="text-sm font-medium">Daily automation</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              RSS + AI update automatico ogni mattina.
            </p>
          </div>
        </aside>

        <section className="px-5 py-6 md:px-10 md:py-9">
          <header className="mb-9 flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-neutral-500">
                {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.94] tracking-[-0.07em] text-white md:text-7xl">
                Il segnale migliore dalle tue fonti.
              </h1>
              <p className="mt-5 text-sm text-neutral-500">{userEmail}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 md:flex">
                <Search size={15} className="text-neutral-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca nel feed..."
                  className="w-64 bg-transparent text-sm outline-none placeholder:text-neutral-600"
                />
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.07]"
              >
                <LogOut size={15} />
                Esci
              </button>
            </div>
          </header>

          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <Metric label="Fonti attive" value={sources.filter((s) => s.is_active).length} />
            <Metric label="Articoli raccolti" value={articles.length} />
            <Metric label="Scelte AI" value={aiPicks.length} />
          </section>

          <section className="mb-10">
            {!heroPick ? (
              <EmptyState text="Nessuna selezione AI disponibile." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <a
                  href={heroPick.articles?.url}
                  target="_blank"
                  className="group relative min-h-[520px] overflow-hidden rounded-[2.4rem] border border-white/[0.08] bg-neutral-900 shadow-2xl shadow-black/40"
                >
                  <EditorialVisual index={1} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />

                  <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-9">
                    <div className="flex items-center justify-between">
                      <Pill>{heroPick.articles?.sources?.name ?? 'Fonte'} · {heroPick.category ?? 'Generale'}</Pill>
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
                </a>

                <div className="grid gap-4">
                  {sidePicks.map((pick, index) => (
                    <SidePick key={pick.id} pick={pick} index={index + 2} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-8 xl:grid-cols-[1fr_390px]">
            <div>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-medium tracking-[-0.04em] text-white">Feed completo</h2>
                  <p className="mt-2 text-sm text-neutral-500">Tutte le ultime notizie raccolte.</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025]">
                {filteredArticles.map((article, index) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    className="grid gap-4 border-b border-white/[0.06] p-5 transition last:border-b-0 hover:bg-white/[0.04] md:grid-cols-[92px_1fr]"
                  >
                    <MiniVisual index={index} />
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span>{article.sources?.name ?? 'Fonte sconosciuta'}</span>
                        <span>•</span>
                        <Clock size={13} />
                        <span>
                          {article.published_at
                            ? new Date(article.published_at).toLocaleString('it-IT')
                            : 'Data non disponibile'}
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
                  </a>
                ))}
              </div>
            </div>

            <aside className="space-y-5">
              {lowerPicks.length > 0 && (
                <Panel title="Altre scelte AI">
                  <div className="space-y-3">
                    {lowerPicks.map((pick) => (
                      <a key={pick.id} href={pick.articles?.url} target="_blank" className="block rounded-2xl bg-black/25 p-4 hover:bg-white/[0.04]">
                        <div className="mb-2 text-xs text-neutral-600">{pick.category} · {pick.score}</div>
                        <p className="text-sm font-medium leading-5 text-neutral-200">{pick.articles?.title}</p>
                      </a>
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

                  {message && <p className="text-sm leading-6 text-neutral-500">{message}</p>}
                </div>
              </Panel>

              <Panel title="Fonti">
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div key={source.id} className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{source.name}</div>
                          <div className="mt-1 text-xs text-neutral-600">Priorità {source.priority}</div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => toggleSource(source)} className="rounded-xl bg-white/[0.05] p-2">
                            <Power size={14} className={source.is_active ? 'text-emerald-400' : 'text-neutral-600'} />
                          </button>
                          <button onClick={() => deleteSource(source.id)} className="rounded-xl bg-white/[0.05] p-2">
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
            </aside>
          </section>
        </section>
      </div>
    </main>
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

function NavItem({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
      active ? 'bg-white text-black' : 'text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300'
    }`}>
      {icon}
      {label}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-600">{label}</div>
      <div className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-white">{value}</div>
    </div>
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

function EditorialVisual({ index }: { index: number }) {
  const gradients = [
    'from-indigo-500/50 via-fuchsia-500/25 to-orange-400/30',
    'from-emerald-500/40 via-cyan-500/20 to-blue-500/30',
    'from-amber-500/40 via-rose-500/20 to-purple-500/30',
  ]

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`}>
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_18%),radial-gradient(circle_at_80%_30%,white_0,transparent_14%),radial-gradient(circle_at_50%_80%,white_0,transparent_20%)]" />
    </div>
  )
}

function MiniVisual({ index }: { index: number }) {
  const gradients = [
    'from-indigo-400/40 to-fuchsia-400/20',
    'from-emerald-400/35 to-cyan-400/20',
    'from-orange-400/35 to-rose-400/20',
    'from-sky-400/35 to-violet-400/20',
  ]

  return (
    <div className={`hidden h-24 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} md:block`} />
  )
}

function SidePick({ pick, index }: { pick: any; index: number }) {
  return (
    <a href={pick.articles?.url} target="_blank" className="group relative min-h-[160px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-neutral-900 p-5 transition hover:border-white/15">
      <EditorialVisual index={index} />
      <div className="absolute inset-0 bg-black/65" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">{pick.articles?.sources?.name ?? 'Fonte'} · {pick.category}</p>
          <Score value={pick.score} />
        </div>
        <h3 className="text-xl font-medium leading-tight tracking-[-0.03em] group-hover:underline">
          {pick.articles?.title}
        </h3>
      </div>
    </a>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-5">
      <h3 className="mb-5 text-lg font-medium tracking-tight text-white">{title}</h3>
      {children}
    </section>
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