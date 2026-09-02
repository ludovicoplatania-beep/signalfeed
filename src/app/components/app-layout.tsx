import { Bell, Compass, Cpu, LogOut, Newspaper, Search, Sparkles, Star } from 'lucide-react'
import { Brand } from './ui'
import type { Section } from './types'

const sections = [
  { id: 'today', label: 'Oggi', icon: Sparkles },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'ai', label: 'Scelte AI', icon: Cpu },
  { id: 'saved', label: 'Salvati', icon: Star },
  { id: 'sources', label: 'Fonti', icon: Compass },
]

type NavigationProps = {
  activeSection: Section
  setActiveSection: (section: Section) => void
}

export function Sidebar({ activeSection, setActiveSection }: NavigationProps) {
  return (
    <aside className="sticky top-0 hidden h-screen border-r border-white/[0.06] bg-black/20 px-5 py-7 backdrop-blur-xl lg:flex lg:flex-col">
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

      <div className="mt-auto rounded-[1.8rem] border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/15 to-[#B88A44]/10 p-5">
        <div className="flex items-center gap-2 text-[#C59A52]">
          <Bell size={16} />
          <span className="text-xs font-medium uppercase tracking-[0.18em]">
            Selezione personale
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-neutral-300">
          Il tuo flusso informativo viene continuamente raffinato in base ai segnali comportamentali.
        </p>
      </div>
    </aside>
  )
}

export function Header({
  activeSection,
  query,
  setQuery,
  refreshData,
  logout,
}: {
  activeSection: Section
  query: string
  setQuery: (query: string) => void
  refreshData: () => Promise<void>
  logout: () => Promise<void>
}) {
  return (
    <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-[#C59A52]">
          Athena
        </div>

        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-white">
          {getSectionTitle(activeSection)}
        </h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/35 px-4 py-3">
          <Search size={16} className="text-neutral-500" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca segnali, temi, fonti..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600 md:w-56"
          />
        </div>

        <button
          onClick={refreshData}
          className="relative overflow-hidden rounded-2xl border border-[#B88A44]/30 bg-[linear-gradient(180deg,rgba(197,154,82,0.22),rgba(0,0,0,0.35))] px-5 py-3 text-sm font-medium text-[#E2C188] backdrop-blur-xl transition hover:border-[#C59A52]/50"
        >
          Aggiorna
        </button>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-neutral-300 transition hover:bg-white/[0.05]"
        >
          <LogOut size={15} />
          Logout
        </button>
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
