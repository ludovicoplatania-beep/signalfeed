import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ArticleImage, ArticleThumbnail, Panel, Pill, ArticleActions } from './ui'
import type { AiPick, OpenReader, ToggleSave } from './types'

function GlassScore({ value }: { value: number }) {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#B88A44]/35 bg-black/55 text-sm font-semibold text-[#E2C188] shadow-[0_0_22px_rgba(184,138,68,0.10)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,154,82,0.20),transparent_72%)]" />
      <span className="relative z-10">{value}</span>
    </div>
  )
}

type PickProps = {
  pick: AiPick
  saved: boolean
  toggleSave: ToggleSave
  openReader: OpenReader
}

export function HeroPick({ pick, saved, toggleSave, openReader }: PickProps) {
  if (!pick.articles) return null

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-neutral-950 shadow-2xl shadow-black/40 md:min-h-[520px] md:rounded-[2.4rem]"
    >
      <button onClick={() => pick.articles && openReader(pick.articles)} className="absolute inset-0 z-10 text-left">
        <ArticleImage imageUrl={pick.articles?.image_url} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/62 to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(184,138,68,0.16),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(139,92,246,0.18),transparent_30%)]" />
      </button>

      <div className="pointer-events-none relative z-20 flex flex-col justify-between p-5 md:absolute md:inset-0 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Pill>{pick.articles?.sources?.name ?? 'Fonte'} · {pick.category}</Pill>

          <div className="pointer-events-auto flex flex-wrap items-center gap-2 md:gap-3">
            <ArticleActions articleId={pick.articles?.id} saved={saved} onClick={() => toggleSave(pick.articles?.id)} />
            <GlassScore value={pick.score} />
          </div>
        </div>

        <div className="mt-12 md:mt-0">
          <p className="mb-4 flex items-center gap-2 text-sm text-[#E2C188]">
            <Sparkles size={15} />
            {pick.reason?.startsWith('Scoperta') ? 'Scoperta per te' : pick.selection_method === 'automatic' ? 'Selezione automatica' : 'Scelta IA principale'}
          </p>

          <button onClick={() => pick.articles && openReader(pick.articles)} className="pointer-events-auto text-left">
            <h2 className="max-w-4xl text-3xl font-semibold [overflow-wrap:anywhere] leading-[1.04] tracking-[-0.055em] text-white md:text-6xl">
              {pick.articles?.title}
            </h2>
          </button>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 md:text-lg md:leading-8">
            {pick.summary}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function SidePick({ pick, saved, toggleSave, openReader }: PickProps) {
  if (!pick.articles) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35 }}
      className="group relative min-w-0 min-h-[150px] overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-neutral-950 p-5 shadow-xl shadow-black/20 md:min-h-[170px] md:rounded-[2rem]"
    >
      <button onClick={() => pick.articles && openReader(pick.articles)} className="absolute inset-0 text-left">
        <ArticleImage imageUrl={pick.articles?.image_url} />
        <div className="absolute inset-0 bg-black/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(139,92,246,0.16),transparent_34%)]" />
      </button>

      <div className="relative pointer-events-none">
        <p className="mb-3 text-xs leading-5 text-neutral-400">{pick.articles?.sources?.name ?? 'Fonte'} · {pick.selection_method === 'automatic' ? 'Automatica' : 'IA'}{pick.reason?.startsWith('Scoperta') ? ' · Scoperta' : ''}{pick.publisher_key ? ` · ${pick.publisher_key}` : ''}</p>

        <button onClick={() => pick.articles && openReader(pick.articles)} className="pointer-events-auto text-left">
          <h3 className="line-clamp-3 text-lg font-medium [overflow-wrap:anywhere] leading-snug tracking-[-0.025em] text-white group-hover:underline md:text-xl">
            {pick.articles?.title}
          </h3>
        </button>
        <div className="pointer-events-auto mt-4 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
          <ArticleActions articleId={pick.articles?.id} saved={saved} onClick={() => toggleSave(pick.articles?.id)} small />
          <div aria-label={`Rilevanza ${pick.score} su 100`} className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl border border-[#B88A44]/30 bg-black/50 px-2 text-sm font-semibold text-[#E2C188]">{pick.score}</div>
        </div>
      </div>
    </motion.div>
  )
}

type PickListProps = {
  picks: AiPick[]
  savedIds: Set<string>
  toggleSave: ToggleSave
  openReader: OpenReader
}

export function AiSideList({ picks, savedIds, toggleSave, openReader }: PickListProps) {
  if (!picks.length) return null

  return (
    <Panel title="Altre priorità">
      <div className="space-y-3">
        {picks.map((pick) => (
          <div
            key={pick.id}
            className="grid grid-cols-1 md:grid-cols-[68px_minmax(0,1fr)] xl:grid-cols-[68px_minmax(0,1fr)_auto] gap-3 rounded-2xl border border-white/[0.06] bg-black/25 p-3 hover:border-[#B88A44]/20 hover:bg-white/[0.04]"
          >
            <button onClick={() => pick.articles && openReader(pick.articles)} className="hidden text-left md:block">
              <ArticleThumbnail imageUrl={pick.articles?.image_url} compact />
            </button>

            <button onClick={() => pick.articles && openReader(pick.articles)} className="text-left">
              <div className="mb-1 text-xs text-neutral-400">{pick.category} · {pick.score} · {pick.selection_method === 'automatic' ? 'Automatica' : 'IA'}</div>
              <p className="line-clamp-3 text-sm font-medium leading-5 text-neutral-200">
                {pick.articles?.title}
              </p>
            </button>

            <div className="md:col-start-2 xl:col-start-auto"><ArticleActions articleId={pick.articles?.id}
              saved={pick.articles ? savedIds.has(pick.articles.id) : false}
              onClick={() => toggleSave(pick.articles?.id)}
              small
            /></div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function AiCurationView({ picks, savedIds, toggleSave, openReader }: PickListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {picks.map((pick) => (
        <SidePick
          key={pick.id}
          pick={pick}
          saved={pick.articles ? savedIds.has(pick.articles.id) : false}
          toggleSave={toggleSave}
          openReader={openReader}
        />
      ))}
    </div>
  )
}
