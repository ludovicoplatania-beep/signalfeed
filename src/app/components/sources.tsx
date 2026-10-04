import { ExternalLink, Plus, Power, Trash2, Pencil } from 'lucide-react'
import type { Source } from './types'
import { Input, Panel } from './ui'
import { CoveragePanel } from './coverage'

type SourcesPanelProps = {
  full?: boolean
  sources: Source[]
  name: string
  setName: (value: string) => void
  websiteUrl: string
  setWebsiteUrl: (value: string) => void
  rssUrl: string
  setRssUrl: (value: string) => void
  priority: number
  setPriority: (value: number) => void
  addSource: () => Promise<void>
  toggleSource: (source: Source) => Promise<void>
  deleteSource: (sourceId: string) => Promise<void>
  editing?: boolean
  editSource: (source: Source) => void
  cancelEdit: () => void
  message: string
  expandSources?: () => Promise<void>
  expanding?: boolean
}

export function SourcesPanel(props: SourcesPanelProps) {
  function sourceHealth(source: Source) {
    if (!source.is_active) return { label: 'In pausa', className: 'text-foreground bg-surface' }
    if (source.last_error) return { label: 'Da controllare', className: 'text-danger bg-rose-500/10' }
    if (source.is_stale) return { label: 'Da aggiornare', className: 'text-warning bg-amber-500/10' }
    if (source.last_success_at) return { label: 'Operativa', className: 'text-success bg-emerald-500/10' }
    return { label: 'Non verificata', className: 'text-warning bg-amber-500/10' }
  }

  return (
    <div className={props.full ? 'grid gap-6 xl:grid-cols-[430px_1fr]' : 'space-y-5'}>
      <div className="space-y-6">
      <Panel title={props.editing ? "Modifica fonte" : "Aggiungi fonte"}>
        <div className="space-y-3">
          <Input value={props.name} setValue={props.setName} placeholder="Nome fonte" />
          <Input value={props.websiteUrl} setValue={props.setWebsiteUrl} placeholder="Sito web" />
          <Input value={props.rssUrl} setValue={props.setRssUrl} placeholder="URL RSS" />

          <select
            value={props.priority}
            onChange={(e) => props.setPriority(Number(e.target.value))}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none"
          >
            <option value={1}>Priorità 1 · bassa</option>
            <option value={2}>Priorità 2</option>
            <option value={3}>Priorità 3</option>
            <option value={4}>Priorità 4</option>
            <option value={5}>Priorità 5 · massima</option>
          </select>

          <button
            onClick={props.addSource}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-on-accent transition hover:opacity-90"
          >
            <Plus size={16} />
            Salva fonte
          </button>

          {props.editing && <button onClick={props.cancelEdit} className="text-sm text-muted">Annulla modifica</button>}
          {!props.editing && props.expandSources && <div className="mt-4 border-t border-line pt-4">
            <p className="mb-3 text-sm leading-6 text-muted">Amplia IA, tecnologia, videogiochi, Sicilia, diritto e altri settori. Vengono aggiunti feed o elenchi ufficiali verificati con notizie recenti; le fonti già presenti restano gestibili singolarmente.</p>
            <button disabled={props.expanding} onClick={props.expandSources} className="w-full rounded-2xl border border-line px-4 py-3 text-sm text-accent disabled:opacity-50">{props.expanding ? 'Verifica delle nuove fonti…' : 'Amplia con fonti verificate'}</button>
          </div>}
          {props.message && <p className="text-sm leading-6 text-muted">{props.message}</p>}
        </div>
      </Panel>

      {props.full && <CoveragePanel />}
      </div>

      <Panel title="Fonti">
        <div className="space-y-3">
          {props.sources.map((source: Source) => (
            <div key={source.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${sourceHealth(source).className}`}>
                {sourceHealth(source).label}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{source.name}</div>
                  <div className="mt-1 text-xs text-muted">
                    Priorità {source.priority} · {source.is_active ? 'Attiva' : 'Disattivata'}
                  </div>
                  {source.last_checked_at && (
                    <div className="mt-1 text-xs text-muted">
                      Ultimo controllo {new Date(source.last_checked_at).toLocaleString('it-IT')} · {source.last_new_count} nuovi · {source.last_updated_count} aggiornati · {source.last_import_count} controllati
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted">Ultimo successo: {source.last_success_at ? new Date(source.last_success_at).toLocaleString('it-IT') : 'mai verificata'}</p>
                  {source.resolved_feed_url && <p className="mt-1 break-all text-xs text-muted">Feed verificato: {source.resolved_feed_url}</p>}
                  {source.last_error && <p className="mt-2 break-words text-xs leading-5 text-danger">{source.last_error}</p>}
                </div>

                <div className="flex gap-2">
                  <button aria-label={`Modifica ${source.name}`} onClick={() => props.editSource(source)} className="rounded-xl bg-surface p-2"><Pencil size={14} /></button>
                  <button aria-label={`${source.is_active ? "Sospendi" : "Attiva"} ${source.name}`} onClick={() => props.toggleSource(source)} className="rounded-xl bg-surface p-2">
                    <Power size={14} className={source.is_active ? 'text-success' : 'text-muted'} />
                  </button>

                  <button aria-label={`Elimina ${source.name}`} onClick={() => props.deleteSource(source.id)} className="rounded-xl bg-surface p-2">
                    <Trash2 size={14} className="text-muted" />
                  </button>
                </div>
              </div>

              {source.website_url && (
                <a href={source.website_url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-xs text-muted hover:text-foreground">
                  <ExternalLink size={12} />
                  Apri sito
                </a>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
