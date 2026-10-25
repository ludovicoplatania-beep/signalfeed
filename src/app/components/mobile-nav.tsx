import { BookOpen, LayoutGrid, MoreHorizontal, Newspaper } from 'lucide-react'
import { useRef } from 'react'
import Link from 'next/link'
import { sectors } from '@/lib/sectors/catalog'
import type { Section } from './types'

const items = [
  { id: 'today', label: 'Per te', icon: Newspaper },
  { id: 'sectors', label: 'Settori', icon: LayoutGrid },
  { id: 'saved', label: 'Salvati', icon: BookOpen },
  { id: 'more', label: 'Altro', icon: MoreHorizontal },
] as const
export function MobileNav({ activeSection, setActiveSection }: { activeSection: Section; setActiveSection: (section: Section) => void }) {
  const picker = useRef<HTMLDialogElement>(null)
  return <>
    <nav aria-label="Navigazione principale" className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-surface pb-[max(0rem,env(safe-area-inset-bottom))] xl:hidden">
      {items.map(item => {
        const Icon = item.icon
        const active = item.id === 'today' ? ['today', 'feed', 'ai', 'topic', 'events'].includes(activeSection) : item.id === 'more' ? ['more', 'sources'].includes(activeSection) : activeSection === item.id
        return <button key={item.id} aria-label={item.label} aria-current={active ? 'page' : undefined} aria-haspopup={item.id === 'sectors' ? 'dialog' : undefined} onClick={() => item.id === 'sectors' ? picker.current?.showModal() : setActiveSection(item.id)} className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 border-t-2 -mt-px ${active ? 'border-signal text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>
          <Icon size={21} strokeWidth={active ? 2 : 1.7} aria-hidden="true" /><span className="te-label text-inherit">{item.label}</span>
        </button>
      })}
    </nav>
    <dialog ref={picker} aria-labelledby="mobile-sector-title" className="fixed inset-x-0 top-auto bottom-0 mx-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto border border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground backdrop:bg-black/60">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id="mobile-sector-title" className="te-label text-foreground">Scegli un settore</h2><button autoFocus onClick={() => picker.current?.close()} className="te-key">Chiudi</button></div>
      <nav aria-label="Scelta rapida del settore" className="grid grid-cols-2 gap-2">{sectors.map(sector => <Link key={sector.slug} href={`/settori/${sector.slug}`} onClick={() => picker.current?.close()} className="flex min-h-14 items-center border border-line bg-background px-3 py-3 text-sm hover:border-foreground">{sector.name}</Link>)}</nav>
      <Link href="/eventi" onClick={() => picker.current?.close()} className="te-key mt-3 w-full text-accent">Eventi e coperture</Link>
    </dialog>
  </>
}
