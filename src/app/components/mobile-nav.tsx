import { Compass, Cpu, Newspaper, Sparkles, Star } from 'lucide-react'
import type { Section } from './types'

const items = [
  { id: 'today', icon: Sparkles },
  { id: 'feed', icon: Newspaper },
  { id: 'ai', icon: Cpu },
  { id: 'saved', icon: Star },
  { id: 'sources', icon: Compass },
]

export function MobileNav({
  activeSection,
  setActiveSection,
}: {
  activeSection: Section
  setActiveSection: (section: Section) => void
}) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-[2rem] border border-white/[0.08] bg-black/70 px-3 py-3 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id

        return (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as Section)}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition ${
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
