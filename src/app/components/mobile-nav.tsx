import { Bookmark, Newspaper, Rss, Sparkles, Wand2 } from 'lucide-react'

export function MobileNav({ activeSection, setActiveSection }: any) {
  const items = [
    { key: 'today', label: 'Today', icon: <Sparkles size={18} /> },
    { key: 'feed', label: 'Feed', icon: <Newspaper size={18} /> },
    { key: 'saved', label: 'Saved', icon: <Bookmark size={18} /> },
    { key: 'ai', label: 'AI', icon: <Wand2 size={18} /> },
    { key: 'sources', label: 'Sources', icon: <Rss size={18} /> },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#050505]/90 px-2 pb-3 pt-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
              activeSection === item.key
                ? 'bg-white text-black'
                : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-200'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
