import { ExternalLink, Plus, Power, Trash2 } from 'lucide-react'
import type { Source } from './types'
import { Input, Panel } from './ui'

export function SourcesPanel(props: any) {
  return (
    <div className={props.full ? 'grid gap-6 xl:grid-cols-[430px_1fr]' : 'space-y-5'}>
      <Panel title="Aggiungi fonte">
        <div className="space-y-3">
          <Input value={props.name} setValue={props.setName} placeholder="Nome fonte" />
          <Input value={props.websiteUrl} setValue={props.setWebsiteUrl} placeholder="Sito web" />
          <Input value={props.rssUrl} setValue={props.setRssUrl} placeholder="URL RSS" />

          <select
            value={props.priority}
            onChange={(e) => props.setPriority(Number(e.target.value))}
            className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none"
          >
            <option value={1}>Priorità 1</option>
            <option value={2}>Priorità 2</option>
            <option value={3}>Priorità 3</option>
            <option value={4}>Priorità 4</option>
            <option value={5}>Priorità 5</option>
          </select>

          <button
            onClick={props.addSource}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            <Plus size={16} />
            Salva fonte
          </button>

          {props.message && <p className="text-sm leading-6 text-neutral-500">{props.message}</p>}
        </div>
      </Panel>

      <Panel title="Fonti">
        <div className="space-y-3">
          {props.sources.map((source: Source) => (
            <div key={source.id} className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{source.name}</div>
                  <div className="mt-1 text-xs text-neutral-600">
                    Priorità {source.priority} · {source.is_active ? 'Attiva' : 'Disattivata'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => props.toggleSource(source)} className="rounded-xl bg-white/[0.05] p-2">
                    <Power size={14} className={source.is_active ? 'text-emerald-400' : 'text-neutral-600'} />
                  </button>

                  <button onClick={() => props.deleteSource(source.id)} className="rounded-xl bg-white/[0.05] p-2">
                    <Trash2 size={14} className="text-neutral-500" />
                  </button>
                </div>
              </div>

              {source.website_url && (
                <a href={source.website_url} target="_blank" className="mt-3 flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-300">
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
