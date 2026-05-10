'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Sparkles,
  Rss,
  Search,
  LogOut,
  Plus,
  Trash2,
  Power,
  ExternalLink,
  Newspaper,
  Bookmark,
  Clock,
  Settings,
  Zap,
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
      .limit(60)

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
    setSources([])
    setArticles([])
    setAiPicks([])
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
      setMessage('Errore salvataggio fonte: ' + error.message)
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
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="animate-pulse text-zinc-400">Caricamento SignalFeed...</div>
      </main>
    )
  }

  if (!userEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#27272a,#09090b_55%)] px-6 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <Rss size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black">SignalFeed</h1>
              <p className="text-sm text-zinc-400">News intelligence personale</p>
            </div>
          </div>

          <h2 className="text-4xl font-black tracking-tight">Bentornato.</h2>
          <p className="mt-3 text-zinc-400">
            Entra con magic link e accedi alla tua rassegna intelligente.
          </p>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="La tua email"
            className="mt-8 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4 outline-none transition focus:border-white/40"
          />

          <button
            onClick={login}
            className="mt-3 w-full rounded-2xl bg-white px-4 py-4 font-black text-zinc-950 transition hover:bg-zinc-200"
          >
            Entra con email
          </button>

          {message && <p className="mt-4 text-sm text-zinc-300">{message}</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-white/10 bg-zinc-950/90 p-6 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-lg">
              <Rss size={21} />
            </div>
            <div>
              <h1 className="text-xl font-black">SignalFeed</h1>
              <p className="text-xs text-zinc-500">AI curated news</p>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={<Sparkles size={18} />} label="Scelte da ChatGPT" active />
            <SidebarItem icon={<Newspaper size={18} />} label="Tutte le notizie" />
            <SidebarItem icon={<Rss size={18} />} label="Fonti" />
            <SidebarItem icon={<Bookmark size={18} />} label="Salvati" />
            <SidebarItem icon={<Settings size={18} />} label="Impostazioni" />
          </nav>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold">
              <Zap size={16} />
              Automazione attiva
            </div>
            <p className="text-sm leading-6 text-zinc-400">
              RSS + AI si aggiornano automaticamente alle 07:00, 13:00 e 19:00.
            </p>
          </div>
        </aside>

        <section className="p-5 md:p-8">
          <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
                Dashboard
              </p>
              <h2 className="text-4xl font-black tracking-tight md:text-6xl">
                La tua rassegna.
              </h2>
              <p className="mt-3 text-zinc-400">Accesso: {userEmail}</p>
            </div>

            <button
              onClick={logout}
              className="flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-zinc-200 transition hover:bg-white/10"
            >
              <LogOut size={18} />
              Esci
            </button>
          </header>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Fonti attive" value={sources.filter((s) => s.is_active).length} />
            <StatCard label="Notizie importate" value={articles.length} />
            <StatCard label="Scelte AI" value={aiPicks.length} />
          </div>

          <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 shadow-2xl md:p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <Sparkles size={18} />
                  Scelte da ChatGPT
                </div>
                <h3 className="text-3xl font-black">Da non perdere</h3>
              </div>
              <div className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-zinc-950">
                Top {aiPicks.length}
              </div>
            </div>

            {aiPicks.length === 0 ? (
              <Empty text="Non ci sono ancora scelte AI. Lancia /api/pick o attendi il prossimo aggiornamento." />
            ) : (
              <div className="grid gap-4">
                {aiPicks.map((pick) => (
                  <a
                    key={pick.id}
                    href={pick.articles?.url}
                    target="_blank"
                    className="group rounded-3xl border border-white/10 bg-zinc-950 p-5 transition hover:border-white/30 hover:bg-zinc-900"
                  >
                    <div className="flex gap-5">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                          <span>{pick.articles?.sources?.name ?? 'Fonte sconosciuta'}</span>
                          <span>•</span>
                          <span>{pick.category ?? 'Generale'}</span>
                        </div>

                        <h4 className="text-xl font-black leading-tight group-hover:underline md:text-2xl">
                          {pick.articles?.title}
                        </h4>

                        <p className="mt-4 leading-7 text-zinc-300">{pick.summary}</p>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
                          <span className="font-bold text-white">Perché conta: </span>
                          {pick.reason}
                        </div>
                      </div>

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-zinc-950">
                        {pick.score}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-3xl font-black">Tutte le notizie</h3>
                  <p className="mt-2 text-zinc-400">Ultimi articoli dalle fonti attive.</p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3">
                  <Search size={18} className="text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cerca..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                {filteredArticles.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    className="rounded-3xl border border-white/10 bg-zinc-950 p-5 transition hover:border-white/25 hover:bg-zinc-900"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
                      <span>{article.sources?.name ?? 'Fonte sconosciuta'}</span>
                      <span>•</span>
                      <Clock size={14} />
                      <span>
                        {article.published_at
                          ? new Date(article.published_at).toLocaleString('it-IT')
                          : 'Data non disponibile'}
                      </span>
                    </div>

                    <h4 className="text-lg font-black leading-tight">{article.title}</h4>

                    {article.excerpt && (
                      <p className="mt-3 line-clamp-2 leading-6 text-zinc-400">{article.excerpt}</p>
                    )}
                  </a>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
                <h3 className="text-2xl font-black">Aggiungi fonte</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Inserisci RSS, sito e priorità. Le fonti attive alimentano la rassegna.
                </p>

                <div className="mt-5 space-y-3">
                  <Input value={name} setValue={setName} placeholder="Nome fonte" />
                  <Input value={websiteUrl} setValue={setWebsiteUrl} placeholder="Sito web" />
                  <Input value={rssUrl} setValue={setRssUrl} placeholder="URL RSS" />

                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                  >
                    <option value={1}>Priorità 1 - Bassa</option>
                    <option value={2}>Priorità 2</option>
                    <option value={3}>Priorità 3 - Normale</option>
                    <option value={4}>Priorità 4</option>
                    <option value={5}>Priorità 5 - Alta</option>
                  </select>

                  <button
                    onClick={addSource}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-black text-zinc-950 transition hover:bg-zinc-200"
                  >
                    <Plus size={18} />
                    Salva fonte
                  </button>

                  {message && <p className="text-sm text-zinc-400">{message}</p>}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
                <h3 className="text-2xl font-black">Fonti</h3>

                <div className="mt-5 space-y-3">
                  {sources.map((source) => (
                    <div key={source.id} className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-black">{source.name}</div>
                          <div className="mt-1 text-xs text-zinc-500">Priorità {source.priority}</div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleSource(source)}
                            className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                          >
                            <Power size={16} className={source.is_active ? 'text-emerald-400' : 'text-zinc-500'} />
                          </button>

                          <button
                            onClick={() => deleteSource(source.id)}
                            className="rounded-xl border border-red-900/50 bg-red-950/40 p-2 hover:bg-red-950"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {source.website_url && (
                        <a
                          href={source.website_url}
                          target="_blank"
                          className="mt-3 flex items-center gap-2 text-xs text-zinc-500 hover:text-white"
                        >
                          <ExternalLink size={13} />
                          {source.website_url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${
        active ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-sm font-bold text-zinc-500">{label}</div>
      <div className="mt-2 text-4xl font-black">{value}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950 p-8 text-center text-zinc-500">
      {text}
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
      className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
    />
  )
}