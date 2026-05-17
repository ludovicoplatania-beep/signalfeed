'use client'

import { ArrowRight, Brain, Newspaper, Rss } from 'lucide-react'
import { motion } from 'framer-motion'

export function Onboarding({
  step,
  goToSources,
  refreshData,
}: {
  step: 'sources' | 'refresh' | 'ai'
  goToSources: () => void
  refreshData: () => void
}) {
  const config = {
    sources: {
      icon: <Rss size={24} />,
      title: 'Aggiungi le tue prime fonti',
      description:
        'Inserisci feed RSS di siti, blog o newsletter per iniziare a costruire il tuo SignalFeed.',
      action: 'Apri Sources',
      onClick: goToSources,
    },

    refresh: {
      icon: <Newspaper size={24} />,
      title: 'Importa i primi articoli',
      description:
        'Hai aggiunto le fonti. Ora avvia il primo aggiornamento per popolare il feed.',
      action: 'Aggiorna adesso',
      onClick: refreshData,
    },

    ai: {
      icon: <Brain size={24} />,
      title: 'Generazione AI in corso',
      description:
        'SignalFeed sta preparando topic, ranking e selezione intelligente degli articoli.',
      action: 'Aggiorna feed',
      onClick: refreshData,
    },
  }

  const current = config[step]

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-7"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
            {current.icon}
          </div>

          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white">
            {current.title}
          </h2>

          <p className="mt-4 text-base leading-7 text-neutral-400">
            {current.description}
          </p>
        </div>

        <button
          onClick={current.onClick}
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-medium text-black transition hover:bg-neutral-200"
        >
          {current.action}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  )
}