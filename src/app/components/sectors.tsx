'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sectors, getSector } from '@/lib/sectors/catalog'
import { uniqueArticles } from '@/lib/articles/identity'
import type { SectorCuration } from '@/lib/sectors/server'
import type { Article, OpenReader, ToggleSave } from './types'
import { FeedList } from './feed'
import { AiCurationView } from './picks'

export function SectorLinks({ active }: { active?: string }) {
  return <nav aria-label="Settori di interesse" className="flex flex-wrap gap-2">
    {sectors.map(sector => <Link key={sector.slug} href={`/settori/${sector.slug}`} aria-current={active === sector.slug ? 'page' : undefined}
      className={`rounded-xl border px-3 py-2 text-xs transition ${active === sector.slug ? 'border-[#C59A52]/40 bg-[#C59A52]/15 text-[#E2C188]' : 'border-white/10 text-neutral-400 hover:text-white'}`}>{sector.name}</Link>)}
  </nav>
}

export function SectorView({ slug, query, source, period, version, savedIds, toggleSave, openReader }: {
  slug: string; query: string; source: string; period: string; version: number
  savedIds: Set<string>; toggleSave: ToggleSave; openReader: OpenReader
}) {
  const router = useRouter()
  const sector = getSector(slug)!
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [next, setNext] = useState(0)
  const [loading, setLoading] = useState(true)
  const [curation, setCuration] = useState<SectorCuration | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const abort = useRef<AbortController | null>(null)
  const generationLock = useRef(false)

  async function load(offset = 0) {
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ q: query, period, offset: String(offset) })
      if (source) params.set('source', source)
      const selection = new URL(window.location.href).searchParams.get('selezione')
      if (selection) params.set('selection', selection)
      const response = await fetch(`/api/sectors/${slug}?${params}`, { cache: 'no-store', signal: controller.signal })
      if (response.status === 401) { router.replace('/access'); return }
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Caricamento non disponibile')
      if (controller.signal.aborted) return
      setArticles(current => uniqueArticles(offset ? [...current, ...data.articles] : data.articles))
      setTotal(data.total); setNext(data.nextOffset); setCuration(data.curation)
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Caricamento non disponibile')
    } finally { if (abort.current === controller) setLoading(false) }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { setArticles([]); setTotal(0); setNext(0); void load() }, 250)
    return () => { window.clearTimeout(timer); abort.current?.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, query, source, period, version])

  async function generate() {
    if (generationLock.current) return
    generationLock.current = true; setGenerating(true); setError('')
    try {
      const response = await fetch(`/api/sectors/${slug}`, { method: 'POST' })
      if (response.status === 401) { router.replace('/access'); return }
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Selezione non disponibile')
      setCuration(data.curation)
      if (data.curation) {
        const url = new URL(window.location.href)
        url.searchParams.set('selezione', data.curation.id)
        window.history.replaceState(null, '', url)
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Selezione non disponibile') }
    finally { generationLock.current = false; setGenerating(false) }
  }
  return <div className="space-y-8">
    <div className="space-y-4"><p className="text-neutral-400">{sector.description}</p><SectorLinks active={slug} /></div>
    <section className="rounded-[2rem] border border-[#C59A52]/15 bg-white/[0.025] p-4 md:p-6" aria-label="Selezione IA del settore">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-medium">Scelte IA · {sector.name}</h2><p className="mt-1 text-xs text-neutral-400">Dalle notizie recenti del settore, secondo interessi e preferenze.</p></div>
        <button onClick={generate} disabled={generating || loading || total === 0} className="rounded-xl border border-[#C59A52]/30 px-4 py-3 text-sm text-[#E2C188] disabled:opacity-50">{generating ? 'Selezione in corso…' : curation ? 'Ricalcola IA del settore' : 'Seleziona con IA'}</button>
      </div>
      {curation ? <>
        <p className="mb-4 text-xs text-neutral-400">{curation.picks.filter(p => p.selection_method === 'ai').length} scelte IA · {curation.picks.filter(p => p.selection_method === 'automatic').length} automatiche · {new Date(curation.created_at).toLocaleString('it-IT')}{curation.warning ? ` · ${curation.warning}` : ''}</p>
        <AiCurationView picks={curation.picks} savedIds={savedIds} toggleSave={toggleSave} openReader={openReader} />
      </> : <p className="text-sm text-neutral-400">Avvia la selezione per ottenere le scelte IA di questo settore. Il risultato resta disponibile anche sugli altri dispositivi.</p>}
    </section>
    {error && <div role="alert" className="rounded-xl border border-red-500/30 p-4 text-sm text-red-200">{error} <button onClick={() => void load()} className="ml-3 underline">Riprova</button></div>}
    <div aria-busy={loading}>
      <FeedList articles={articles} savedIds={savedIds} toggleSave={toggleSave} openReader={openReader} title={`Notizie · ${sector.name}`} subtitle={loading ? 'Caricamento notizie…' : `${total.toLocaleString('it-IT')} articoli · più recenti prima · filtri per fonte e periodo in alto.`} />
      {next < total && <button disabled={loading} onClick={() => void load(next)} className="mt-5 w-full rounded-xl border border-white/10 p-3 text-sm disabled:opacity-50">{loading ? 'Caricamento…' : 'Carica altre notizie'}</button>}
    </div>
  </div>
}
