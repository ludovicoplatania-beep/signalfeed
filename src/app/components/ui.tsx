import type { ReactNode } from 'react'
import Image from 'next/image'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { FeedbackButtons } from './article-feedback'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={44}
        height={44}
        className={compact ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-lg'}
      />

      <div className="font-mono leading-none">
        <div className="text-sm font-bold tracking-[0.3em] text-foreground">ATHENA</div>
        {!compact && <div className="te-label mt-1.5">SF-01 · briefing</div>}
      </div>
    </div>
  )
}

/** Spia quadrata: accesa (segnale), in allerta (ambra) o spenta. */
export function Led({ state = 'on', pulse = false }: { state?: 'on' | 'warn' | 'off'; pulse?: boolean }) {
  const color = state === 'on' ? 'bg-signal' : state === 'warn' ? 'bg-warning' : 'bg-line'
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 shrink-0 ${color} ${pulse ? 'animate-pulse' : ''}`} />
}

/** Indicatore di livello a segmenti, come i meter dei dispositivi audio. */
export function Meter({ value, max = 100, segments = 10, className = '' }: { value: number; max?: number; segments?: number; className?: string }) {
  const lit = Math.max(0, Math.min(segments, Math.round((value / (max || 1)) * segments)))
  return (
    <div aria-hidden="true" className={`flex gap-[2px] ${className}`}>
      {Array.from({ length: segments }, (_, index) => (
        <span key={index} className={`h-[5px] flex-1 ${index < lit ? 'bg-signal' : 'bg-line'}`} />
      ))}
    </div>
  )
}

/** Modulo del pannello: cornice sottile con etichetta stampata nell'intestazione. */
export function Module({ label, meta, children, className = '' }: { label: ReactNode; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-surface ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="te-label text-foreground">{label}</span>
        {meta && <span className="te-label">{meta}</span>}
      </header>
      {children}
    </section>
  )
}

/** Cella di lettura: valore grande in monospace, etichetta e livello. */
export function Readout({ label, value, total, level }: { label: string; value: number | string; total?: number | string; level?: number }) {
  return (
    <div className="min-w-0 px-3 py-3">
      <div className="te-label truncate">{label}</div>
      <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums text-foreground">
        <span className="text-2xl font-semibold leading-none">{value}</span>
        {total !== undefined && <span className="text-xs text-muted">/{total}</span>}
      </div>
      {level !== undefined && <Meter value={level} className="mt-3" />}
    </div>
  )
}

/** Punteggio: valore in monospace con livello a cinque segmenti. */
export function Score({ value }: { value: number }) {
  return (
    <div className="w-12 shrink-0 text-right font-mono tabular-nums">
      <div className="text-sm font-bold text-foreground">{value}</div>
      <Meter value={value} segments={5} className="mt-1.5" />
    </div>
  )
}

export function Pill({ children }: { children: ReactNode }) {
  return <div className="te-label border border-line px-2 py-1 text-foreground">{children}</div>
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
        className="absolute inset-0 h-full w-full object-cover grayscale-[35%]"
      />
    )
  }

  return null
}

export function ArticleThumbnail({ imageUrl, compact = false }: { imageUrl?: string | null; compact?: boolean }) {
  const size = compact ? 'h-16' : 'h-24'

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={400}
        height={compact ? 64 : 96}
        unoptimized
        className={`${size} w-full border border-line object-cover grayscale-[35%]`}
      />
    )
  }

  return <div className={`${size} border border-line`} />
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Module label={title}>
      <div className="p-3">{children}</div>
    </Module>
  )
}

export function Input({ value, setValue, placeholder }: { value: string; setValue: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="min-h-11 w-full border border-line bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-signal"
    />
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-line p-8 text-center">
      <span className="te-label">{text}</span>
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
      className={`flex items-center gap-2 text-sm text-muted transition hover:text-foreground ${saved ? 'shadow-[inset_0_-2px_0_var(--signal)]' : ''} ${
        small ? 'min-h-11 min-w-11 justify-center px-3' : 'min-h-11 px-4'
      }`}
    >
      {saved ? <BookmarkCheck size={18} className="text-accent" /> : <Bookmark size={18} />}
      {!small && <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground">{saved ? 'Salvato' : 'Salva'}</span>}
    </button>
  )
}

/** Striscia di tasti piatti separati da linee sottili. */
export function ArticleActions({ articleId, saved, onClick, small = false, framed = true }: { articleId?: string; saved: boolean; onClick: () => void; small?: boolean; framed?: boolean }) {
  return <div className={`inline-flex items-stretch divide-x divide-line ${framed ? 'border border-line' : 'border-l border-line'}`}>
    <SaveButton saved={saved} onClick={onClick} small={small} />
    {articleId && <FeedbackButtons articleId={articleId} small={small} />}
  </div>
}
