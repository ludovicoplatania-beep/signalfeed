'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

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
    const { data, error } = await supabase
      .from('sources')
      .select('id, name, website_url, rss_url, is_active, priority')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('Errore caricamento fonti: ' + error.message)
      return
    }

    setSources(data ?? [])
  }

  async function loadArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        url,
        excerpt,
        published_at,
        sources (
          name
        )
      `)
      .order('published_at', { ascending: false })
      .limit(50)

    if (error) {
      setMessage('Errore caricamento articoli: ' + error.message)
      return
    }

    setArticles(data ?? [])
  }

  async function loadAiPicks(currentUserId: string) {
    const { data, error } = await supabase
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
          sources (
            name
          )
        )
      `)
      .eq('user_id', currentUserId)
      .order('score', { ascending: false })
      .limit(10)

    if (error) {
      setMessage('Errore caricamento Scelte da ChatGPT: ' + error.message)
      return
    }

    setAiPicks(data ?? [])
  }

  async function login() {
    setMessage('Invio link di accesso...')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setMessage('Errore: ' + error.message)
    } else {
      setMessage('Controlla la tua email e clicca il link di accesso.')
    }
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
    setMessage('Fonte aggiunta correttamente.')

    await loadSources(userId)
  }

  async function toggleSource(source: Source) {
    if (!userId) return

    await supabase
      .from('sources')
      .update({ is_active: !source.is_active })
      .eq('id', source.id)

    await loadSources(userId)
  }

  async function deleteSource(sourceId: string) {
    if (!userId) return

    const ok = confirm('Vuoi davvero eliminare questa fonte?')
    if (!ok) return

    await supabase.from('sources').delete().eq('id', sourceId)
    await loadSources(userId)
  }

  if (loading) {
    return <main style={pageStyle}>Caricamento...</main>
  }

  if (!userEmail) {
    return (
      <main style={pageStyle}>
        <h1 style={titleStyle}>SignalFeed</h1>
        <p style={subtitleStyle}>
          La tua piattaforma personale per raccogliere notizie e far selezionare a ChatGPT quelle più interessanti.
        </p>

        <div style={{ marginTop: 40, maxWidth: 420 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Scrivi la tua email"
            style={inputStyle}
          />

          <button onClick={login} style={buttonStyle}>
            Entra con email
          </button>

          {message && <p style={messageStyle}>{message}</p>}
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <h1 style={titleStyle}>SignalFeed</h1>
          <p style={subtitleStyle}>Sei entrato come: {userEmail}</p>
        </div>

        <button onClick={logout} style={{ ...buttonStyle, width: 100 }}>
          Esci
        </button>
      </div>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Scelte da ChatGPT</h2>
        <p style={subtitleStyle}>
          Le notizie più interessanti selezionate automaticamente tra le tue fonti.
        </p>

        {aiPicks.length === 0 ? (
          <p style={subtitleStyle}>Non ci sono ancora scelte AI. Vai su /api/pick per generarle.</p>
        ) : (
          <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
            {aiPicks.map((pick) => (
              <a key={pick.id} href={pick.articles?.url} target="_blank" style={articleCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>
                      {pick.articles?.sources?.name ?? 'Fonte sconosciuta'} · {pick.category ?? 'Generale'}
                    </div>

                    <strong style={{ fontSize: 21 }}>{pick.articles?.title}</strong>
                  </div>

                  <div style={scoreStyle}>{pick.score}</div>
                </div>

                <p style={{ color: '#d4d4d8', marginTop: 14, lineHeight: 1.5 }}>
                  {pick.summary}
                </p>

                <div style={reasonStyle}>
                  <strong style={{ color: 'white' }}>Perché è stata scelta: </strong>
                  {pick.reason}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Aggiungi fonte</h2>
        <p style={subtitleStyle}>Scegli i giornali, riviste e siti da cui raccogliere notizie.</p>

        <div style={formGridStyle}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome fonte" style={inputStyle} />
          <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Sito web" style={inputStyle} />
          <input value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} placeholder="URL RSS" style={inputStyle} />

          <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} style={inputStyle}>
            <option value={1}>Priorità 1 - Bassa</option>
            <option value={2}>Priorità 2</option>
            <option value={3}>Priorità 3 - Normale</option>
            <option value={4}>Priorità 4</option>
            <option value={5}>Priorità 5 - Alta</option>
          </select>
        </div>

        <button onClick={addSource} style={{ ...buttonStyle, marginTop: 18, maxWidth: 240 }}>
          Salva fonte
        </button>

        {message && <p style={messageStyle}>{message}</p>}
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Le tue fonti</h2>

        {sources.length === 0 ? (
          <p style={subtitleStyle}>Non hai ancora aggiunto fonti.</p>
        ) : (
          <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
            {sources.map((source) => (
              <div key={source.id} style={sourceRowStyle}>
                <div>
                  <strong>{source.name}</strong>
                  <p style={{ margin: '6px 0 0', color: '#a1a1aa', fontSize: 14 }}>
                    {source.rss_url}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#71717a', fontSize: 13 }}>
                    Priorità: {source.priority} · Stato: {source.is_active ? 'Attiva' : 'Disattivata'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleSource(source)} style={smallButtonStyle}>
                    {source.is_active ? 'Disattiva' : 'Attiva'}
                  </button>

                  <button onClick={() => deleteSource(source.id)} style={dangerButtonStyle}>
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Notizie importate</h2>
        <p style={subtitleStyle}>Ultime notizie lette automaticamente dalle fonti attive.</p>

        {articles.length === 0 ? (
          <p style={subtitleStyle}>Non ci sono ancora notizie importate.</p>
        ) : (
          <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
            {articles.map((article) => (
              <a key={article.id} href={article.url} target="_blank" style={articleCardStyle}>
                <div style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>
                  {article.sources?.name ?? 'Fonte sconosciuta'}
                </div>

                <strong style={{ fontSize: 20 }}>{article.title}</strong>

                {article.excerpt && (
                  <p style={{ color: '#a1a1aa', marginTop: 10, lineHeight: 1.5 }}>
                    {article.excerpt}
                  </p>
                )}

                {article.published_at && (
                  <p style={{ color: '#71717a', marginTop: 10, fontSize: 13 }}>
                    {new Date(article.published_at).toLocaleString('it-IT')}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background: '#09090b',
  color: 'white',
  padding: 40,
  fontFamily: 'Arial, sans-serif',
}

const titleStyle = {
  fontSize: 48,
  fontWeight: 800,
  margin: 0,
}

const subtitleStyle = {
  marginTop: 12,
  color: '#a1a1aa',
  fontSize: 18,
}

const cardStyle = {
  marginTop: 32,
  padding: 28,
  borderRadius: 24,
  background: '#18181b',
  border: '1px solid #27272a',
}

const sectionTitleStyle = {
  fontSize: 30,
  fontWeight: 800,
  margin: 0,
}

const formGridStyle = {
  marginTop: 24,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
}

const inputStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: '1px solid #3f3f46',
  background: '#09090b',
  color: 'white',
  fontSize: 16,
}

const buttonStyle = {
  marginTop: 12,
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 0,
  background: 'white',
  color: 'black',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
}

const smallButtonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #3f3f46',
  background: '#27272a',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #7f1d1d',
  background: '#450a0a',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
}

const sourceRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  padding: 18,
  borderRadius: 16,
  background: '#09090b',
  border: '1px solid #27272a',
}

const articleCardStyle = {
  display: 'block',
  padding: 18,
  borderRadius: 16,
  background: '#09090b',
  border: '1px solid #27272a',
  color: 'white',
  textDecoration: 'none',
}

const scoreStyle = {
  minWidth: 58,
  height: 42,
  borderRadius: 14,
  background: 'white',
  color: 'black',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
}

const reasonStyle = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  background: '#18181b',
  color: '#a1a1aa',
}

const messageStyle = {
  marginTop: 16,
  color: '#d4d4d8',
}