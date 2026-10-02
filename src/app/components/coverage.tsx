'use client'
import { useState } from 'react'
import type { CoverageReport } from '@/lib/coverage/benchmark'
import { Panel } from './ui'

export function CoveragePanel() {
  const [report, setReport] = useState<CoverageReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function measure() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/coverage', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Verifica non riuscita')
      setReport(result)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Verifica non riuscita'); setReport(null) }
    finally { setBusy(false) }
  }
  return <Panel title="Copertura delle notizie">
    <p className="text-sm leading-6 text-neutral-400">Campione fisso di 20 eventi, dal 24 settembre al 2 ottobre 2026, in cinque settori. Le corrispondenze suggerite vanno controllate aprendo gli articoli: questo campione non certifica la copertura generale.</p>
    <button onClick={measure} disabled={busy} className="mt-3 w-full rounded-2xl border border-[#B88A44]/30 px-4 py-3 text-sm text-[#E2C188] disabled:opacity-50">{busy ? 'Misurazione…' : 'Misura la copertura'}</button>
    {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
    {report && <div className="mt-4 space-y-4" aria-live="polite">
      <p className="text-sm">{report.covered}/{report.total} eventi con corrispondenze · {report.percentage}% · obiettivo 85%</p>
      <p className="text-xs text-neutral-400">{report.scanned} articoli verificati · {new Date(report.measuredAt).toLocaleString('it-IT')}</p>
      <table className="w-full text-left text-sm"><thead><tr><th>Settore</th><th>Eventi</th></tr></thead><tbody>{report.sectors.map(row => <tr key={row.sector}><td className="py-1">{row.sector}</td><td>{row.covered}/{row.total}</td></tr>)}</tbody></table>
      {report.events.map(event => <div key={event.id} className="rounded-xl border border-white/10 p-3 text-sm">
        <p className={event.matches.length ? 'text-emerald-300' : 'text-amber-200'}>{event.matches.length ? 'Da verificare' : 'Mancante'} · {event.sector}</p>
        <a href={event.reference} target="_blank" rel="noreferrer" className="mt-1 block underline">{event.title}</a>
        {event.matches.map(match => <a key={match.id} href={match.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-neutral-400 underline">{match.title}{match.dateUncertain ? ' · data non disponibile' : ''}</a>)}
      </div>)}
    </div>}
  </Panel>
}
