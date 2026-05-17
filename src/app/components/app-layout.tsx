import { motion } from 'framer-motion'
import { Bookmark, LogOut, Newspaper, RefreshCcw, Rss, Search, Sparkles, Wand2 } from 'lucide-react'
import type { Section } from './types'
import { Brand } from './ui'

export function Header({ activeSection, userEmail, query, setQuery, refreshData, logout }: any) {
  const titles: Record<Section, string> = {
    today: 'Il segnale migliore dalle tue fonti.',
    feed: 'Tutto il feed, ordinato.',
    sources: 'Gestisci le tue fonti.',
    saved: 'La tua reading list.',
    ai: 'Tutte le scelte AI.',
    topic: 'Tema caldo.',
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-start"
    >
      <div>
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-neutral-500 md:tracking-[0.35em]">
          {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        <h1 className="max-w-5xl text-4xl font-semibold leading-[0.96] tracking-[-0.075em] text-white md:text-7xl">
          {titles[activeSection as Section]}
        </h1>

        <p className="mt-5 text-sm text-neutral-500">{userEmail}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex w-full items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 md:w-auto">
          <Search size={15} className="text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca nel feed..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-600 md:w-64"
          />
        </div>

        <button onClick={refreshData} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.07]">
          <RefreshCcw size={15} />
          Aggiorna
        </button>

        <button onClick={logout} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.07]">
          <LogOut size={15} />
          Esci
        </button>
      </div>
    </motion.header>
  )
}

export function Sidebar({ activeSection, setActiveSection }: any) {
  return (
    <aside className="hidden min-h-screen border-r border-white/[0.07] px-5 py-6 lg:block">
      <Brand />

      <nav className="mt-10 space-y-1">
        <NavItem active={activeSection === 'today'} icon={<Sparkles size={16} />} label="Today" onClick={() => setActiveSection('today')} />
        <NavItem active={activeSection === 'feed'} icon={<Newspaper size={16} />} label="Feed" onClick={() => setActiveSection('feed')} />
        <NavItem active={activeSection === 'sources'} icon={<Rss size={16} />} label="Sources" onClick={() => setActiveSection('sources')} />
        <NavItem active={activeSection === 'saved'} icon={<Bookmark size={16} />} label="Saved" onClick={() => setActiveSection('saved')} />
        <NavItem active={activeSection === 'ai'} icon={<Wand2 size={16} />} label="AI Curation" onClick={() => setActiveSection('ai')} />
      </nav>

      <div className="mt-10 rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4">
        <p className="text-sm font-medium">Daily automation</p>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          RSS + AI aggiornati automaticamente tramite Vercel Cron.
        </p>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, active = false, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
        active ? 'bg-white text-black' : 'text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
