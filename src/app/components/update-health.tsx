'use client'
import { healthSummary } from '@/lib/health/status'
import type { UpdateJob } from '@/lib/server/pipeline'
import type { Source } from './types'
const modes = { rss: 'Importazione', ai: 'Selezione IA', all: 'Aggiornamento completo', profile: 'Preferenze' }
const states = { running: 'In corso', completed: 'Completato', partial: 'Parziale', failed: 'Fallito' }
function date(value: string | null) { return value ? new Date(value).toLocaleString('it-IT') : 'Mai verificato' }
export function UpdateHealth({ sources, job, now, error }: { sources: Source[]; job: UpdateJob | null; now: number; error: string }) {
  const health = healthSummary(sources, now)
  const warning = Boolean(error || health.issues.length || job?.status === 'failed' || job?.status === 'partial')
  const lags = (job?.result?.rss ?? []).flatMap(s => s.ingestionLagSamplesMs ?? []).filter(n => Number.isFinite(n) && n >= 0).sort((a,b) => a-b)
  const median = lags.length ? Math.round((lags[Math.floor((lags.length - 1) / 2)] + lags[Math.floor(lags.length / 2)]) / 2 / 60_000) : null
  return <details className={`mb-4 rounded-2xl border px-3 py-2 text-xs ${warning ? 'border-amber-500/30 text-amber-200' : 'border-white/10 text-neutral-400'}`}>
    <summary className="cursor-pointer leading-5">Aggiornamenti · {error ? 'Verifica non disponibile' : health.issues.length ? `${health.issues.length}/${health.active} fonti da controllare` : `${health.active} fonti senza errori o ritardi rilevati`}{job ? ` · ${states[job.status]}` : ''}</summary>
    <div className="mt-3 space-y-2 leading-5" aria-live="polite">
      {error && <p role="alert">{error} I dati mostrati possono essere precedenti all’ultimo ciclo.</p>}
      <p>Ultimo controllo di una fonte: {date(health.lastCheck)}. Controllo meno recente: {date(health.oldestCheck)}.</p>
      <p>Controlli previsti ogni 30 minuti per priorità 4–5, ogni 60 per le altre; segnalazione di ritardo dopo ulteriori 35 minuti di tolleranza del pianificatore.</p>
      {job ? <>
        <p>{modes[job.mode]} · {states[job.status]} · avvio {date(job.started_at)} · {job.status === 'running' ? 'ultimo segnale' : 'fine'} {date(job.updated_at)} · fase {job.phase}</p>
        {job.message && <p className="text-amber-200">{job.message}</p>}
        {job.result && <p>{job.result.summary.sourcesChecked} fonti controllate · {job.result.summary.sourcesFailed} fallite · {job.result.summary.newArticles} articoli nuovi. {median === null ? 'Ritardo pubblicazione→importazione non misurabile in questo ciclo.' : `Ritardo mediano pubblicazione→prima importazione: ${median} minuti (${lags.length} articoli datati nelle ultime 24 ore; esclusi recuperi e date mancanti).`}</p>}
        {Object.entries(job.result?.stages ?? {}).filter(([,stage]) => !stage.success).map(([name,stage]) => <p key={name} className="text-amber-200">Fase {name}: {stage.message || 'Fallita'}</p>)}
      </> : <p>Nessun ciclo registrato.</p>}
      {health.issues.map(source => <p key={source.id}><strong>{source.name}</strong>: {source.last_error || (source.status === 'late' ? `controllo in ritardo di ${source.overdueMinutes} minuti oltre la tolleranza` : 'verifica assente o date incoerenti')} · ultimo successo {date(source.last_success_at)}</p>)}
      <p>Lo stato descrive i controlli effettuati, non garantisce che l’editore abbia pubblicato o reso disponibili tutte le notizie. L’ultimo ciclo registrato viene sostituito dal successivo.</p>
    </div>
  </details>
}
