import type { ReactNode } from 'react'
import Image from 'next/image'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { FeedbackButtons } from './article-feedback'

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={44}
        height={44}
        className="h-10 w-10 rounded-lg"
      />

      <div className="font-mono leading-none">
        <div className="text-sm font-bold tracking-[0.3em] text-foreground">
          ATHENA
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-signal" />
          SF-01 · briefing
        </div>
      </div>
    </div>
  )
}

export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-line bg-surface p-4 md:min-h-[145px] md:p-5"
    >
      <div className="text-[10px] font-medium font-mono uppercase tracking-[0.16em] text-muted md:text-xs md:tracking-[0.18em]">
        {label}
      </div>
      <div className="mt-4 font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground md:text-4xl">
        {value}
      </div>
    </div>
  )
}

export function Score({ value }: { value: number }) {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-foreground bg-surface font-mono text-sm font-bold tabular-nums text-foreground">

      <span className="relative z-10">{value}</span>
    </div>
  )
}
export function Pill({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-1 font-mono text-xs text-foreground">
      {children}
    </div>
  )
}

export function ArticleImage({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 60vw"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
    )
  }

  return null
}

export function ArticleThumbnail({ imageUrl, compact = false }: { imageUrl?: string | null; compact?: boolean }) {
  const size = compact ? 'h-20' : 'h-24'

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={400}
        height={compact ? 64 : 96}
        unoptimized
        className={`${size} w-full rounded-lg object-cover`}
      />
    )
  }

  return <div className={`${size} rounded-2xl    `} />
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="mb-5 border-l-2 border-signal pl-3 text-lg font-medium tracking-tight text-foreground">
        {title}
      </h3>
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
      className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-line"
    />
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
      {text}
    </div>
  )
}

export function SaveButton({
  saved,
  onClick,
  small = false,
}: {
  saved: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      aria-label={saved ? 'Rimuovi dai salvati' : 'Salva articolo'}
      title={saved ? 'Rimuovi dai salvati' : 'Salva articolo'}
      aria-pressed={saved}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`group relative flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition hover:bg-accent-soft hover:text-accent ${
        small ? 'min-h-11 min-w-11 justify-center px-3 py-2' : 'min-h-11 px-4 py-3'
      }`}
    >


      <div className="relative z-10 flex items-center gap-2">
        {saved ? (
          <BookmarkCheck size={18} className="text-accent" />
        ) : (
          <Bookmark size={18} className="text-muted" />
        )}

        {!small && (
          <span className="text-foreground">
            {saved ? 'Salvato' : 'Salva'}
          </span>
        )}
      </div>
    </button>
  )
}

export function ArticleActions({ articleId, saved, onClick, small = false }: { articleId?: string; saved: boolean; onClick: () => void; small?: boolean }) {
  return <div className="flex flex-wrap items-start gap-1.5">
    <SaveButton saved={saved} onClick={onClick} small={small} />
    {articleId && <FeedbackButtons articleId={articleId} small={small} />}
  </div>
}
