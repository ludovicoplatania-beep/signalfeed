import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ArticleImage, ArticleThumbnail, Panel, Pill, SaveButton, Score } from './ui'

export function HeroPick({ pick, saved, toggleSave, openReader }: any) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-neutral-900 shadow-2xl shadow-black/40 md:min-h-[560px] md:rounded-[2.5rem]"
    >
      <button onClick={() => openReader(pick.articles)} className="absolute inset-0 z-10 text-left">
        <ArticleImage imageUrl={pick.articles?.image_url} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
      </button>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-5 md:p-10">
        <div className="flex items-center justify-between gap-3">
          <Pill>{pick.articles?.sources?.name ?? 'Fonte'} · {pick.category}</Pill>

          <div className="pointer-events-auto flex items-center gap-2 md:gap-3">
            <SaveButton saved={saved} onClick={() => toggleSave(pick.articles?.id)} />
            <Score value={pick.score} />
          </div>
        </div>

        <div>
          <p className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
            <Sparkles size={15} />
            Scelta principale
          </p>

          <button onClick={() => openReader(pick.articles)} className="pointer-events-auto text-left">
            <h2 className="max-w-4xl text-3xl font-semibold leading-[1.04] tracking-[-0.055em] text-white md:text-6xl">
              {pick.articles?.title}
            </h2>
          </button>

          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 md:text-lg md:leading-8">{pick.summary}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function SidePick({ pick, saved, toggleSave, openReader }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35 }}
      className="group relative min-h-[170px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-neutral-900 p-5"
    >
      <button onClick={() => openReader(pick.articles)} className="absolute inset-0 text-left">
        <ArticleImage imageUrl={pick.articles?.image_url} />
        <div className="absolute inset-0 bg-black/68" />
      </button>

      <div className="relative pointer-events-none">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">{pick.articles?.sources?.name ?? 'Fonte'} · {pick.category}</p>

          <div className="pointer-events-auto flex items-center gap-3">
            <SaveButton saved={saved} onClick={() => toggleSave(pick.articles?.id)} small />
            <Score value={pick.score} />
          </div>
        </div>

        <button onClick={() => openReader(pick.articles)} className="pointer-events-auto text-left">
          <h3 className="text-xl font-medium leading-tight tracking-[-0.03em] group-hover:underline">
            {pick.articles?.title}
          </h3>
        </button>
      </div>
    </motion.div>
  )
}

export function AiSideList({ picks, savedIds, toggleSave, openReader }: any) {
  if (!picks.length) return null

  return (
    <Panel title="Altre scelte AI">
      <div className="space-y-3">
        {picks.map((pick: any) => (
          <div key={pick.id} className="grid grid-cols-[68px_1fr_auto] gap-3 rounded-2xl bg-black/25 p-3 hover:bg-white/[0.04]">
            <button onClick={() => openReader(pick.articles)} className="text-left">
              <ArticleThumbnail imageUrl={pick.articles?.image_url} compact />
            </button>

            <button onClick={() => openReader(pick.articles)} className="text-left">
              <div className="mb-1 text-xs text-neutral-600">{pick.category} · {pick.score}</div>
              <p className="line-clamp-3 text-sm font-medium leading-5 text-neutral-200">{pick.articles?.title}</p>
            </button>

            <SaveButton saved={savedIds.has(pick.articles?.id)} onClick={() => toggleSave(pick.articles?.id)} small />
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function AiCurationView({ picks, savedIds, toggleSave, openReader }: any) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {picks.map((pick: any) => (
        <SidePick
          key={pick.id}
          pick={pick}
          saved={savedIds.has(pick.articles?.id)}
          toggleSave={toggleSave}
          openReader={openReader}
        />
      ))}
    </div>
  )
}
