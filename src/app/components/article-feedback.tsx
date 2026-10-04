'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { Preference } from '@/lib/ai/preferences'

type FeedbackContext = { preferences: Record<string, Preference | null>; change: (id: string, preference: Preference | null) => Promise<void>; pending: Set<string> }
const Context = createContext<FeedbackContext | null>(null)

export function ArticleFeedbackProvider({ children, initial, onSaved }: { children: ReactNode; initial: Record<string, Preference | null>; onSaved?: () => Promise<unknown> }) {
  const [changes, setChanges] = useState<Record<string, Preference | null>>({})
  const [pending, setPending] = useState<Set<string>>(new Set())
  const lock = useRef(new Set<string>())
  const [message, setMessage] = useState('')
  useEffect(() => { setChanges(current => Object.fromEntries(Object.entries(current).filter(([id]) => lock.current.has(id)))) }, [initial])
  const preferences = { ...initial, ...changes }
  async function change(id: string, preference: Preference | null) {
    if (lock.current.has(id)) return
    lock.current.add(id)
    const previous = preferences[id] ?? null
    setChanges(current => ({ ...current, [id]: preference }))
    setPending(new Set(lock.current))
    setMessage('')
    let saved = false
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article_id: id, preference }) })
      if (!response.ok) throw new Error('Preferenza non salvata. Riprova.')
      saved = true
      setMessage(preference ? 'Preferenza salvata. Influenzerà le prossime scelte IA.' : 'Preferenza annullata.')
    } catch (error) {
      setChanges(current => ({ ...current, [id]: previous }))
      setMessage(error instanceof Error ? error.message : 'Preferenza non salvata.')
    } finally {
      lock.current.delete(id)
      setPending(new Set(lock.current))
      if (saved) void onSaved?.().catch(() => setMessage('Preferenza salvata; ricarica per aggiornare i dati.'))
    }
  }
  return <Context.Provider value={{ preferences, change, pending }}>
    {children}
    {message && <div role="status" className="fixed bottom-24 left-4 right-4 z-[100] mx-auto max-w-lg rounded-2xl border border-line bg-background p-4 text-sm text-foreground  xl:bottom-6">
      <div className="flex items-center justify-between gap-3"><span>{message}</span><button aria-label="Chiudi avviso" onClick={() => setMessage('')}>×</button></div>
    </div>}
  </Context.Provider>
}

export function FeedbackButtons({ articleId, small = false }: { articleId: string; small?: boolean }) {
  const context = useContext(Context)
  const [expanded, setExpanded] = useState(false)
  if (!context) return null
  const preference = context.preferences[articleId]
  const disabled = context.pending.has(articleId)
  const buttonClass = `flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg text-sm transition hover:bg-accent-soft hover:text-accent disabled:opacity-50 ${small ? 'p-2.5' : 'px-3 py-3'}`
  return <>
    <button aria-label={preference === 'like' ? 'Annulla Mi piace' : 'Mi piace'} title="Mi piace: orienta le scelte IA" aria-pressed={preference === 'like'} disabled={disabled} className={`${buttonClass} ${preference === 'like' ? 'text-accent' : 'text-foreground'}`} onClick={event => { event.stopPropagation(); void context.change(articleId, preference === 'like' ? null : 'like') }}>
      <ThumbsUp size={16} />{!small && <span>Mi piace</span>}
    </button>
    <DropdownMenu.Root open={expanded} onOpenChange={setExpanded}>
      <DropdownMenu.Trigger asChild><button aria-label="Meno notizie così" title="Meno notizie così" aria-pressed={preference === 'less_topic' || preference === 'less_source'} disabled={disabled} className={`${buttonClass} ${preference?.startsWith('less_') ? 'text-accent' : 'text-muted'}`} onClick={event => event.stopPropagation()}><ThumbsDown size={16} /></button></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} collisionPadding={12} className="z-[110] w-60 rounded-2xl border border-line bg-background p-2 " onClick={event => event.stopPropagation()}>
        <DropdownMenu.Label className="px-3 py-2 text-xs text-muted">Riduci nelle prossime scelte IA</DropdownMenu.Label>
        {(['less_topic', 'less_source', null] as const).map(value => <DropdownMenu.Item key={value ?? 'clear'} disabled={disabled} className="cursor-pointer rounded-xl px-3 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-surface" onSelect={() => void context.change(articleId, value)}>{value === 'less_topic' ? 'Meno su questo argomento' : value === 'less_source' ? 'Meno da questa fonte' : 'Annulla preferenza'}</DropdownMenu.Item>)}
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
  </>
}

export function PreferencesPanel({ entries }: { entries: { article_id: string; preference: Preference | null; title: string; source_name: string }[] }) {
  const context = useContext(Context)
  const [showAll, setShowAll] = useState(false)
  const active = entries.filter(entry => context?.preferences[entry.article_id])
  if (!context || !active.length) return null
  return <section className="rounded-2xl border border-line bg-surface p-5">
    <h3 className="text-lg text-foreground">Preferenze IA</h3><p className="mt-2 text-xs leading-5 text-muted">Mi piace orienta la selezione. Salva conserva l’articolo per dopo. Puoi annullare ogni scelta.</p>
    <div className="mt-4 space-y-3">{(showAll ? active : active.slice(0, 5)).map(entry => <div key={entry.article_id} className="flex items-start gap-3 text-xs"><div className="min-w-0 flex-1"><p className="text-accent">{context.preferences[entry.article_id] === 'like' ? 'Mi piace' : context.preferences[entry.article_id] === 'less_source' ? `Meno da ${entry.source_name}` : 'Meno su questo argomento'}</p><p className="mt-1 line-clamp-2 text-muted">{entry.title}</p></div><button disabled={context.pending.has(entry.article_id)} aria-label={`Annulla preferenza: ${entry.title}`} className="text-foreground underline disabled:opacity-50" onClick={() => void context.change(entry.article_id, null)}>Annulla</button></div>)}</div>
    {active.length > 5 && <button className="mt-4 text-xs text-foreground" onClick={() => setShowAll(value => !value)}>{showAll ? 'Mostra meno' : `Mostra tutte (${active.length})`}</button>}
  </section>
}
