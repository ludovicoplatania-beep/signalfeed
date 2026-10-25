import { CalendarDays, Cpu, LogOut, Newspaper, Rss, Search, Settings, Sparkles, Star, RefreshCw, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { sectors } from '@/lib/sectors/catalog'
import { Brand, Led } from './ui'
import { ThemeToggle } from './theme-toggle'
import type { Section } from './types'

const sections = [
  { id: 'today', label: 'Per te', icon: Sparkles },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'ai', label: 'Scelte AI', icon: Cpu },
  { id: 'sectors', label: 'Settori', icon: LayoutGrid },
  { id: 'saved', label: 'Salvati', icon: Star },
  { id: 'events', label: 'Eventi', icon: CalendarDays },
  { id: 'sources', label: 'Fonti', icon: Rss },
  { id: 'more', label: 'Impostazioni', icon: Settings },
]

const index = (id: string) => String(sections.findIndex((section) => section.id === id) + 1).padStart(2, '0')

type NavigationProps = {
  activeSection: Section
  setActiveSection: (section: Section) => void
}

export function Sidebar({ activeSection, setActiveSection }: NavigationProps) {
  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-line bg-surface px-4 py-6 xl:flex xl:flex-col">
      <Brand />

      <nav aria-label="Sezioni" className="mt-8 border-t border-line">
        {sections.map((section) => {
          const Icon = section.icon
          const active = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as Section)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 w-full items-center gap-3 border-b border-line px-1 text-left transition ${
                active ? 'text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              <span className="te-label w-5 text-inherit">{index(section.id)}</span>
              <Icon size={16} aria-hidden="true" />
              <span className="flex-1 text-sm">{section.label}</span>
              {active && <Led />}
            </button>
          )
        })}
      </nav>

      <nav aria-label="Pagine tematiche" className="mb-6 mt-6">
        <p className="te-label pb-2">Settori</p>
        {sectors.map((sector) => (
          <Link key={sector.slug} href={`/settori/${sector.slug}`} className="block border-t border-line px-1 py-2 text-sm text-muted hover:text-foreground">
            {sector.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <span className="te-label">Tema</span>
        <ThemeToggle />
      </div>
    </aside>
  )
}

function minutesAgo(now: number, sources: { last_checked_at: string | null }[]) {
  const last = Math.max(0, ...sources.map((source) => (source.last_checked_at ? new Date(source.last_checked_at).getTime() : 0)))
  if (!last) return null
  return Math.max(0, Math.round((now - last) / 60000))
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
  now,
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
  sources: { id: string; name: string; last_checked_at: string | null }[]
  sourceFilter: string
  setSourceFilter: (value: string) => void
  period: string
  setPeriod: (value: string) => void
  now: number
}) {
  const [toolsOpen, setToolsOpen] = useState(false)
  const sync = minutesAgo(now, sources)
  const title = activeSection === 'sectors' ? sectorTitle : getSectionTitle(activeSection)
  const selectClass = 'min-h-11 min-w-0 w-full border border-line bg-background px-3 py-2 text-base text-foreground sm:text-sm xl:max-w-60'
  return (
    <header className="mb-5 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3 xl:hidden">
          <Brand compact />
          <div className="flex items-center gap-1">
            <span className="te-label mr-2 flex items-center gap-2" role="status">
              <Led state={refreshing ? 'on' : sync === null ? 'off' : 'on'} pulse={refreshing} />
              {refreshing ? 'Sync…' : sync === null ? 'Sync —' : `Sync ${sync}′`}
            </span>
            <ThemeToggle />
            <button aria-expanded={toolsOpen} aria-controls="dashboard-tools" onClick={() => setToolsOpen((value) => !value)} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-muted hover:text-foreground">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">{toolsOpen ? 'Chiudi ricerca' : 'Cerca e filtra'}</span>
            </button>
          </div>
        </div>
        <div className="min-w-0">
          <div className="te-label">{index(activeSection === 'sectors' ? 'sectors' : activeSection)} / Athena</div>
          <h1 className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-2xl xl:text-3xl">{title}</h1>
        </div>
      </div>

      <div id="dashboard-tools" className={`${toolsOpen ? 'flex' : 'hidden'} min-w-0 flex-col gap-2 xl:flex xl:items-end`}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <div className="flex min-h-11 min-w-0 items-center gap-2 border border-line bg-background px-3 focus-within:border-signal">
            <Search size={15} className="shrink-0 text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Cerca notizie"
              placeholder="Cerca notizie..."
              className="min-w-0 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted sm:text-sm xl:w-48"
            />
          </div>

          {activeSection === 'ai' && (
            <button onClick={refreshAI} disabled={refreshing} className="te-key order-last col-span-full text-accent">
              Ricalcola IA
            </button>
          )}

          <button onClick={refreshData} disabled={refreshing} aria-label={refreshing ? 'Aggiornamento in corso' : 'Aggiorna'} title="Aggiorna notizie" className="te-key text-accent">
            <RefreshCw size={16} aria-hidden="true" className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{refreshing ? 'Aggiornamento…' : 'Aggiorna'}</span>
          </button>

          <button onClick={logout} aria-label="Logout" title="Logout" className="te-key">
            <LogOut size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {(activeSection === 'feed' || activeSection === 'sectors') && (
          <div className="grid min-w-0 grid-cols-2 gap-2 xl:flex xl:justify-end">
            <select aria-label="Filtra per fonte" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className={selectClass}>
              <option value="">Fonti: tutte</option>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
            </select>
            <select aria-label="Filtra per periodo" value={period} onChange={(event) => setPeriod(event.target.value)} className={selectClass}>
              <option value="all">Tutte le date</option>
              <option value="day">Ultime 24 ore</option>
              <option value="week">Ultimi 7 giorni</option>
              <option value="month">Ultimi 30 giorni</option>
            </select>
          </div>
        )}

        {updateStatus && <p className="te-label text-right">{updateStatus}</p>}
      </div>
    </header>
  )
}

function getSectionTitle(section: string) {
  if (section === 'events') return 'Eventi e coperture'
  switch (section) {
    case 'today':
      return 'Per te'
    case 'feed':
      return 'Tutte le notizie'
    case 'ai':
      return 'Scelte per te'
    case 'saved':
      return 'Articoli salvati'
    case 'more':
      return 'Impostazioni'
    case 'sources':
      return 'Le tue fonti'
    case 'topic':
      return 'Analisi del tema'
    default:
      return 'Athena'
  }
}
