'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BrainCircuit, ChevronDown, LayoutGrid, Cpu, Gamepad2, Scale, MapPin, Landmark, TrendingUp, FlaskConical, Clapperboard, type LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { sectors, getSector } from '@/lib/sectors/catalog'
import { uniqueArticles } from '@/lib/articles/identity'
import type { SectorCuration } from '@/lib/sectors/server'
import type { Article, OpenReader, ToggleSave } from './types'
import { FeedList } from './feed'
import { AiCurationView } from './picks'

const sectorIcons: Record<string, LucideIcon> = {
  ia: BrainCircuit, tecnologia: Cpu, videogiochi: Gamepad2, diritto: Scale,
  'sicilia-catania': MapPin, politica: Landmark, economia: TrendingUp,
  scienza: FlaskConical, cultura: Clapperboard,
}

export function SectorLinks({ active }: { active?: string }) {
  const links = <nav aria-label="Settori di interesse" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-3">
    {sectors.map(sector => {
      const Icon = sectorIcons[sector.slug]
      const selected = active === sector.slug
      return <Link key={sector.slug} href={`/settori/${sector.slug}`} aria-current={selected ? 'page' : undefined}
        className={`flex min-h-14 min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-3 text-sm transition ${selected
          ? 'border-[#B88A44]/35 bg-[linear-gradient(145deg,rgba(197,154,82,0.18),rgba(139,92,246,0.08))] text-[#E2C188] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
          : 'border-[#B88A44]/10 bg-white/[0.025] text-neutral-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] hover:border-[#B88A44]/30 hover:bg-white/[0.05]'}`}>
        <Icon size={18} aria-hidden="true" className="shrink-0 text-[#C59A52]" />
        <span className="min-w-0 text-xs leading-5 sm:text-sm">{sector.name}</span>
      </Link>
    })}
  </nav>
  const current = active ? getSector(active) : undefined
  const Icon = active ? sectorIcons[active] : LayoutGrid
  return <details key={active ?? 'all'} className="group rounded-2xl border border-[#B88A44]/20 bg-[linear-gradient(145deg,rgba(197,154,82,0.08),rgba(139,92,246,0.05))] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
      <Icon size={20} aria-hidden="true" className="shrink-0 text-[#C59A52]" />
      <span className="min-w-0 flex-1 text-sm font-medium text-[#E2C188]">{current?.name ?? 'Esplora i tuoi settori'}</span>
      <span className="text-xs text-neutral-400">{active ? 'Cambia' : '9 settori'}</span>
      <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-neutral-400 transition group-open:rotate-180" />
    </summary>
    <div className="border-t border-white/[0.06] p-3">{links}</div>
  </details>
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
  const [showAllPicks, setShowAllPicks] = useState(false)
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
  return <div className="space-y-5 sm:space-y-6">
    <div className="space-y-3"><SectorLinks active={slug} /><p className="px-1 text-xs leading-5 text-neutral-400 sm:text-sm">{sector.description}</p></div>
    <section className="rounded-3xl border border-[#B88A44]/15 bg-[linear-gradient(145deg,rgba(139,92,246,0.045),rgba(197,154,82,0.035))] p-3 sm:p-5" aria-label="Selezione IA del settore">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><h2 className="text-lg font-medium tracking-tight sm:text-xl">Scelte IA del settore</h2><p className="mt-1 text-xs text-neutral-400">Dalle notizie recenti del settore, secondo interessi e preferenze.</p></div>
        <button onClick={generate} disabled={generating || loading || total === 0} className="min-h-11 shrink-0 rounded-2xl border border-[#B88A44]/30 bg-[linear-gradient(180deg,rgba(197,154,82,0.18),rgba(0,0,0,0.35))] px-4 py-2.5 text-sm text-[#E2C188] disabled:opacity-50">{generating ? 'Selezione in corso…' : curation ? 'Ricalcola IA' : 'Seleziona con IA'}</button>
      </div>
      {curation ? <>
        <p className="mb-4 text-xs text-neutral-400">{curation.picks.filter(p => p.selection_method === 'ai').length} scelte IA · {curation.picks.filter(p => p.selection_method === 'automatic').length} automatiche · {new Date(curation.created_at).toLocaleString('it-IT')}{curation.warning ? ` · ${curation.warning}` : ''}</p>
        <AiCurationView picks={showAllPicks ? curation.picks : curation.picks.slice(0, 2)} savedIds={savedIds} toggleSave={toggleSave} openReader={openReader} />
        {curation.picks.length > 2 && <button onClick={() => setShowAllPicks(value => !value)} aria-expanded={showAllPicks} className="mt-3 min-h-11 w-full rounded-2xl border border-[#B88A44]/15 bg-black/20 px-4 py-2.5 text-sm text-[#E2C188]">{showAllPicks ? 'Mostra meno scelte' : `Mostra le altre ${curation.picks.length - 2} scelte`}</button>}
      </> : <p className="text-sm text-neutral-400">Avvia la selezione per ottenere le scelte IA di questo settore. Il risultato resta disponibile anche sugli altri dispositivi.</p>}
    </section>
    {error && <div role="alert" className="rounded-xl border border-red-500/30 p-4 text-sm text-red-200">{error} <button onClick={() => void load()} className="ml-3 underline">Riprova</button></div>}
    <div aria-busy={loading}>
      <FeedList articles={articles} savedIds={savedIds} toggleSave={toggleSave} openReader={openReader} title="Notizie del settore" subtitle={loading ? 'Caricamento notizie…' : `${total.toLocaleString('it-IT')} articoli · più recenti prima.`} />
      {next < total && <button disabled={loading} onClick={() => void load(next)} className="mt-5 w-full rounded-xl border border-white/10 p-3 text-sm disabled:opacity-50">{loading ? 'Caricamento…' : 'Carica altre notizie'}</button>}
    </div>
  </div>
}
