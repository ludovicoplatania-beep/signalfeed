import { Compass, Cpu, Newspaper, Sparkles, Star, LayoutGrid } from 'lucide-react'
import { useRef } from 'react'
import Link from 'next/link'
import { sectors } from '@/lib/sectors/catalog'
import type { Section } from './types'

const items = [
  { id: 'today', label: 'Oggi', icon: Sparkles },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'ai', label: 'Scelte AI', icon: Cpu },
  { id: 'sectors', label: 'Settori', icon: LayoutGrid },
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
  const picker = useRef<HTMLDialogElement>(null)
  return (
    <>
    <nav aria-label="Navigazione principale" className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-1.25rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-[1.6rem] border border-white/[0.1] bg-[#080808]/92 px-2 py-2 shadow-2xl shadow-black/60 backdrop-blur-2xl xl:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id

        return (
          <button
            key={item.id}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            aria-haspopup={item.id === 'sectors' ? 'dialog' : undefined}
            onClick={() => item.id === 'sectors' ? picker.current?.showModal() : setActiveSection(item.id as Section)}
            className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition ${
              active
                ? 'border border-[#B88A44]/30 bg-[linear-gradient(180deg,rgba(197,154,82,0.18),rgba(0,0,0,0.35))] text-[#E2C188] backdrop-blur-xl'
                : 'border border-transparent text-neutral-400 hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-3">{item.label}</span>
          </button>
        )
      })}
    </nav>
    <dialog ref={picker} aria-labelledby="mobile-sector-title" className="fixed inset-x-0 top-auto bottom-[max(1rem,env(safe-area-inset-bottom))] mx-auto max-h-[80dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border border-[#B88A44]/30 bg-[#101013] p-4 text-neutral-100 shadow-2xl backdrop:bg-black/70">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id="mobile-sector-title" className="text-lg font-medium text-[#E2C188]">Scegli un settore</h2><button autoFocus onClick={() => picker.current?.close()} className="min-h-11 rounded-xl border border-white/10 px-3 text-sm">Chiudi</button></div>
      <nav aria-label="Scelta rapida del settore" className="grid grid-cols-2 gap-2">{sectors.map(sector => <Link key={sector.slug} href={`/settori/${sector.slug}`} onClick={() => picker.current?.close()} className="flex min-h-14 items-center rounded-2xl border border-[#B88A44]/15 bg-white/[0.025] px-3 py-3 text-sm text-neutral-200 hover:border-[#B88A44]/40">{sector.name}</Link>)}</nav>
    </dialog>
    </>
  )
}
