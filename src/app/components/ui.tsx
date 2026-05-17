import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Rss } from 'lucide-react'

export function BackgroundGlow() {
  return (
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(120,119,198,0.16),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(20,184,166,0.08),transparent_26%)]" />
  )
}

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
        <Rss size={18} />
      </div>
      <div>
        <div className="font-medium tracking-tight text-white">SignalFeed</div>
        <div className="text-xs text-neutral-500">AI curated news</div>
      </div>
    </div>
  )
}

export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="flex min-h-[120px] flex-col justify-between rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] p-4 md:min-h-[145px] md:rounded-[1.7rem] md:p-5"
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-600 md:text-xs md:tracking-[0.18em]">{label}</div>
      <div className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-white md:text-4xl">{value}</div>
    </motion.div>
  )
}

export function Score({ value }: { value: number }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black md:h-12 md:w-12 md:text-base">
      {value}
    </div>
  )
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs text-neutral-300 backdrop-blur">
      {children}
    </div>
  )
}

export function ArticleImage({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
    )
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/50 via-fuchsia-500/20 to-orange-400/30" />
  )
}

export function ArticleThumbnail({ imageUrl, compact = false }: { imageUrl?: string | null; compact?: boolean }) {
  const size = compact ? 'h-16' : 'h-24'

  if (imageUrl) {
    return <img src={imageUrl} alt="" className={`hidden ${size} w-full rounded-2xl object-cover md:block`} />
  }

  return <div className={`hidden ${size} rounded-2xl bg-gradient-to-br from-indigo-400/45 to-fuchsia-400/20 md:block`} />
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-5">
      <h3 className="mb-5 text-lg font-medium tracking-tight text-white">{title}</h3>
      {children}
    </div>
  )
}

export function Input({ value, setValue, placeholder }: { value: string; setValue: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-white/20"
    />
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center text-neutral-500">
      {text}
    </div>
  )
}

export function SaveButton({ saved, onClick, small = false }: any) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/45 text-sm font-medium text-white backdrop-blur transition hover:bg-white hover:text-black ${
        small ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      {!small && <span>{saved ? 'Salvato' : 'Salva'}</span>}
    </button>
  )
}
