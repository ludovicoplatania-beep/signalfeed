import { Bell, Compass, Cpu, LogOut, Newspaper, Search, Sparkles, Star, RefreshCw, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { sectors } from '@/lib/sectors/catalog'
import { Brand } from './ui'
import type { Section } from './types'

const sections = [
  { id: 'today', label: 'Oggi', icon: Sparkles },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'ai', label: 'Scelte AI', icon: Cpu },
  { id: 'sectors', label: 'Settori', icon: LayoutGrid },
  { id: 'saved', label: 'Salvati', icon: Star },
  { id: 'sources', label: 'Fonti', icon: Compass },
]

type NavigationProps = {
  activeSection: Section
  setActiveSection: (section: Section) => void
}

export function Sidebar({ activeSection, setActiveSection }: NavigationProps) {
  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-white/[0.06] bg-black/20 px-5 py-7 backdrop-blur-xl lg:flex lg:flex-col">
      <Brand />

      <nav className="mt-10 space-y-2">
        {sections.map((section) => {
          const Icon = section.icon
          const active = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as Section)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? 'border border-[#B88A44]/30 bg-[linear-gradient(180deg,rgba(197,154,82,0.18),rgba(0,0,0,0.35))] text-[#E2C188] shadow-[0_0_30px_rgba(197,154,82,0.08)] backdrop-blur-xl'
                  : 'border border-transparent text-neutral-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          )
        })}
      </nav>

      <nav aria-label="Pagine tematiche" className="mb-6 mt-5 space-y-1"><p className="px-4 py-2 text-xs uppercase tracking-widest text-neutral-500">Settori</p>{sectors.map(sector => <Link key={sector.slug} href={`/settori/${sector.slug}`} className="block rounded-xl px-4 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-white">{sector.name}</Link>)}</nav>
      <div className="mt-auto rounded-[1.8rem] border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/15 to-[#B88A44]/10 p-5">
        <div className="flex items-center gap-2 text-[#C59A52]">
          <Bell size={16} />
          <span className="text-xs font-medium uppercase tracking-[0.18em]">
            Selezione personale
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-neutral-300">
          Mi piace, letture e preferenze aiutano Athena a scegliere le prossime notizie.
        </p>
      </div>
    </aside>
  )
}

export function Header({
  activeSection,
  sectorTitle,
  query,
  setQuery,
  refreshData,
  refreshAI,
  logout,
  refreshing,
  updateStatus,
  sources,
  sourceFilter,
  setSourceFilter,
  period,
  setPeriod,
}: {
  activeSection: Section
  sectorTitle?: string
  query: string
  setQuery: (query: string) => void
  refreshData: () => Promise<void>
  refreshAI: () => Promise<void>
  logout: () => Promise<void>
  refreshing: boolean
  updateStatus: string
  sources: { id: string; name: string }[]
  sourceFilter: string
  setSourceFilter: (value: string) => void
  period: string
  setPeriod: (value: string) => void
}) {
  return (
    <header className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-7 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.24em] text-[#C59A52]">
          Athena
        </div>

        <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl xl:text-4xl tracking-[-0.06em] text-white">
          {activeSection === 'sectors' ? sectorTitle : getSectionTitle(activeSection)}
        </h1>
      </div>

      <div className="flex min-w-0 flex-col gap-2 xl:items-end">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/35 px-3 py-2.5">
          <Search size={16} className="shrink-0 text-neutral-500" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cerca notizie"
            placeholder="Cerca notizie..."
            className="min-w-0 w-full bg-transparent text-base sm:text-sm text-white outline-none placeholder:text-neutral-600 xl:w-48"
          />
          </div>

        {activeSection === 'ai' && <button
          onClick={refreshAI}
          disabled={refreshing}
          className="order-last col-span-full min-h-11 rounded-2xl border border-[#B88A44]/30 px-4 py-3 text-sm text-[#E2C188] disabled:opacity-50"
        >Ricalcola IA</button>}

        <button
          onClick={refreshData}
          disabled={refreshing}
          aria-label={refreshing ? 'Aggiornamento in corso' : 'Aggiorna'}
          title="Aggiorna notizie"
          className="relative flex h-11 min-w-11 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[#B88A44]/30 bg-[linear-gradient(180deg,rgba(197,154,82,0.22),rgba(0,0,0,0.35))] px-3 text-sm font-medium text-[#E2C188] backdrop-blur-xl transition hover:border-[#C59A52]/50"
        >
          <RefreshCw size={17} aria-hidden="true" className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{refreshing ? 'Aggiornamento…' : 'Aggiorna'}</span>
        </button>

        <button
          onClick={logout}
          aria-label="Logout" title="Logout"
          className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-black/30 px-3 text-sm text-neutral-300 transition hover:bg-white/[0.05]"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
        </div>

        {(activeSection === 'feed' || activeSection === 'sectors') && (
          <div className="grid min-w-0 grid-cols-2 gap-2 xl:flex xl:justify-end">
            <select aria-label="Filtra per fonte" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="min-h-11 min-w-0 w-full rounded-2xl border border-white/[0.08] bg-black/40 px-3 py-2 text-base text-neutral-300 sm:text-sm xl:max-w-60">
              <option value="">Tutte le fonti</option>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
            </select>
            <select aria-label="Filtra per periodo" value={period} onChange={(event) => setPeriod(event.target.value)} className="min-h-11 min-w-0 w-full rounded-2xl border border-white/[0.08] bg-black/40 px-3 py-2 text-base text-neutral-300 sm:text-sm xl:max-w-60">
              <option value="all">Tutto l’archivio</option>
              <option value="day">Ultime 24 ore</option>
              <option value="week">Ultimi 7 giorni</option>
              <option value="month">Ultimi 30 giorni</option>
            </select>
          </div>
        )}

        {updateStatus && <p className="text-right text-xs text-neutral-400">{updateStatus}</p>}
      </div>
    </header>
  )
}

function getSectionTitle(section: string) {
  switch (section) {
    case 'today':
      return 'Il tuo briefing'
    case 'feed':
      return 'Tutte le notizie'
    case 'ai':
      return 'Scelte per te'
    case 'saved':
      return 'Articoli salvati'
    case 'sources':
      return 'Le tue fonti'
    case 'topic':
      return 'Analisi del tema'
    default:
      return 'Athena'
  }
}
