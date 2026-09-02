import { Compass, Cpu, Newspaper, Sparkles, Star } from 'lucide-react'
import type { Section } from './types'

const items = [
  { id: 'today', label: 'Oggi', icon: Sparkles },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'ai', label: 'Scelte AI', icon: Cpu },
  { id: 'saved', label: 'Salvati', icon: Star },
  { id: 'sources', label: 'Fonti', icon: Compass },
]

export function MobileNav({
  activeSection,
  setActiveSection,
}: {
  activeSection: Section
  setActiveSection: (section: Section) => void
}) {
  return (
    <nav aria-label="Navigazione principale" className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-1.25rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-[1.6rem] border border-white/[0.1] bg-[#080808]/92 px-2 py-2 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id

        return (
          <button
            key={item.id}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            onClick={() => setActiveSection(item.id as Section)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
              active
                ? 'border border-[#B88A44]/30 bg-[linear-gradient(180deg,rgba(197,154,82,0.18),rgba(0,0,0,0.35))] text-[#E2C188] backdrop-blur-xl'
                : 'border border-transparent text-neutral-500 hover:border-white/[0.06] hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <Icon size={20} />
          </button>
        )
      })}
    </nav>
  )
}
