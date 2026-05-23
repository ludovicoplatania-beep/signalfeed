import { Bell, Compass, Cpu, LogOut, Newspaper, Search, Sparkles, Star } from 'lucide-react'
import { Brand } from './ui'

const sections = [
  {
    id: 'today',
    label: 'Today',
    icon: Sparkles,
  },
  {
    id: 'feed',
    label: 'Feed',
    icon: Newspaper,
  },
  {
    id: 'ai',
    label: 'AI Picks',
    icon: Cpu,
  },
  {
    id: 'saved',
    label: 'Saved',
    icon: Star,
  },
  {
    id: 'sources',
    label: 'Sources',
    icon: Compass,
  },
]

export function Sidebar({ activeSection, setActiveSection }: any) {
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
              onClick={() => setActiveSection(section.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? 'bg-[#d4b06a] text-black shadow-[0_0_30px_rgba(212,176,106,0.25)]'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-[1.8rem] border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/15 to-[#d4b06a]/10 p-5">
        <div className="flex items-center gap-2 text-[#d4b06a]">
          <Bell size={16} />
          <span className="text-xs font-medium uppercase tracking-[0.18em]">
            Athena Signal
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
  userEmail,
  query,
  setQuery,
  refreshData,
  logout,
}: any) {
  return (
    <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-[#d4b06a]">
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
          className="rounded-2xl bg-[#d4b06a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e4c57f]"
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
      return 'Strategic Briefing'

    case 'feed':
      return 'Signal Stream'

    case 'ai':
      return 'AI Priorities'

    case 'saved':
      return 'Saved Intelligence'

    case 'sources':
      return 'Source Network'

    case 'topic':
      return 'Topic Analysis'

    default:
      return 'Athena'
  }
}