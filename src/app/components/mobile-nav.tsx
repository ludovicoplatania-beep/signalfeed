import { Compass, Cpu, Newspaper, Sparkles, Star } from 'lucide-react'

const items = [
  {
    id: 'today',
    icon: Sparkles,
  },
  {
    id: 'feed',
    icon: Newspaper,
  },
  {
    id: 'ai',
    icon: Cpu,
  },
  {
    id: 'saved',
    icon: Star,
  },
  {
    id: 'sources',
    icon: Compass,
  },
]

export function MobileNav({ activeSection, setActiveSection }: any) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-[2rem] border border-white/[0.08] bg-black/70 px-3 py-3 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id

        return (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition ${
              active
                ? 'bg-[#B88A44] text-black shadow-[0_0_24px_rgba(212,176,106,0.28)]'
                : 'text-neutral-500 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <Icon size={20} />
          </button>
        )
      })}
    </nav>
  )
}