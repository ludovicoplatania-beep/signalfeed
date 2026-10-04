import 'server-only'
import { runAlerts } from '@/lib/alerts/server'
import { importSources, repairArticleIdentities, type SourceResult } from '@/lib/rss/importSources'
import { updateInterestProfile } from '@/lib/ai/updateInterestProfile'
import { pickArticles, loadCandidates, type SelectionDiagnostics } from '@/lib/ai/pickArticles'
import { generateTopics } from '@/lib/ai/generateTopics'
import { generateDigest } from '@/lib/ai/generateDigest'
import { syncEvents } from '@/lib/events/sync'
import { attachEventUpdates } from '@/lib/events/incremental'
import { getServiceSupabase } from './clients'

export type RunUpdateOptions = { dueSourcesOnly?: boolean }
export type UpdateMode = 'all' | 'rss' | 'ai' | 'profile'
export type UpdateJob = {
  id: string; user_id: string; mode: UpdateMode; status: 'running' | 'completed' | 'partial' | 'failed'
  phase: string; started_at: string; updated_at: string; message: string | null; result: UpdateResult | null
}
export type UpdateResult = {
  rss: SourceResult[]; warnings: string[]
  aiSelection?: SelectionDiagnostics
  stages: Record<string, { success: boolean; message?: string }>
  summary: { sourcesChecked: number; sourcesOk: number; sourcesFailed: number; itemsProcessed: number; newArticles: number; updatedArticles: number; picksCount: number; automaticPicks: number }
}

export async function startUpdate(userId: string, mode: UpdateMode) {
  const { data, error } = await getServiceSupabase().rpc('athena_start_update', { p_user: userId, p_mode: mode })
  if (error) throw error
  return data as { claimed: boolean; job: UpdateJob }
}

export async function getUpdate(userId: string) {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase.from('athena_updates').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (data?.status === 'running' && Date.now() - new Date(data.updated_at).getTime() > 360_000) {
    const message = 'Aggiornamento interrotto prima del completamento. I dati già acquisiti sono conservati: puoi riprovare.'
    const { data: expired, error: expireError } = await supabase.from('athena_updates')
      .update({ status: 'failed', message, updated_at: new Date().toISOString() }).eq('id', data.id).eq('status', 'running').eq('updated_at', data.updated_at).select('*').maybeSingle()
    if (expireError) throw expireError
    return (expired ?? data) as UpdateJob
  }
  return data as UpdateJob | null
}

export async function runUpdate(job: UpdateJob, options: RunUpdateOptions = {}) {
  const supabase = getServiceSupabase()
  const result: UpdateResult = { rss: [], warnings: [], stages: {}, summary: {
    sourcesChecked: 0, sourcesOk: 0, sourcesFailed: 0, itemsProcessed: 0, newArticles: 0, updatedArticles: 0, picksCount: 0, automaticPicks: 0,
  } }
  const deadline = Date.now() + 270_000
  async function save(values: Record<string, unknown>) {
    const { error } = await supabase.from('athena_updates').update({ ...values, updated_at: new Date().toISOString() }).eq('user_id', job.user_id).eq('id', job.id)
    if (error) throw error
  }
  async function stage(name: string, action: (budgetMs: number) => Promise<unknown>, requestedBudgetMs = 22_000) {
    await save({ phase: name, result })
    const remaining = deadline - Date.now() - 5_000
    if (remaining < 8_000) {
      result.stages[name] = { success: false, message: 'Fase rinviata: tempo disponibile esaurito' }
      result.warnings.push(result.stages[name].message!)
      return
    }
    try { await action(Math.min(requestedBudgetMs, remaining)); result.stages[name] = { success: true } }
    catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error)
      console.warn('Update stage failed:', name, message)
      result.stages[name] = { success: false, message }; result.warnings.push(`${name}: ${message}`)
    }
  }
  try {
    await stage('identity', () => repairArticleIdentities(job.user_id))
    if (!result.stages.identity.success) throw new Error('Riconciliazione degli articoli non riuscita')
    if (job.mode === 'all' || job.mode === 'rss') await stage('sources', async () => {
      result.rss = await importSources(job.user_id, { dueOnly: options.dueSourcesOnly })
      const ok = result.rss.filter((source) => source.success)
      result.summary = { ...result.summary, sourcesChecked: result.rss.length, sourcesOk: ok.length,
        sourcesFailed: result.rss.length - ok.length, itemsProcessed: ok.reduce((sum, source) => sum + source.count, 0),
        newArticles: ok.reduce((sum, source) => sum + source.newCount, 0), updatedArticles: ok.reduce((sum, source) => sum + source.updatedCount, 0) }
      if (result.summary.sourcesFailed) result.warnings.push(`${result.summary.sourcesFailed} fonti non aggiornate: dettagli nella sezione Fonti.`)
    })
    if(result.summary.newArticles>0)await stage('event_updates',()=>attachEventUpdates(job.user_id))
    if (job.mode==='rss'||job.mode==='all') await stage('alerts',async()=>{const alerts=await runAlerts(job.user_id);if(alerts.failed)result.warnings.push(`${alerts.failed} invii push non riusciti: dettagli in Avvisi.`)},25_000)
    if (job.mode === 'all' || job.mode === 'ai' || job.mode === 'profile') await stage('profile', budgetMs => updateInterestProfile(job.user_id, { budgetMs }), 45_000)
    if (job.mode === 'all' || job.mode === 'ai') {
      const candidates = await loadCandidates(job.user_id)
      await stage('picks', async budgetMs => {
        const picks = await pickArticles(job.user_id, candidates, { budgetMs })
        result.summary.picksCount = picks.count; result.summary.automaticPicks = picks.automaticCount
        result.aiSelection = picks.diagnostics
        if (picks.warning) result.warnings.push(picks.warning)
      }, 65_000)
      await stage('topics', budgetMs => generateTopics(job.user_id, candidates, { budgetMs }), 45_000)
      await stage('events', budgetMs => syncEvents(job.user_id, candidates, { budgetMs }), 45_000)
    }
    if (job.mode === 'profile' || result.stages.picks?.success) await stage('digest', budgetMs => generateDigest(job.user_id, { budgetMs }), 45_000)
    const successes = Object.entries(result.stages).filter(([name, stage]) => name !== 'identity' && stage.success).length
    const status = !successes || ((job.mode === 'rss' || job.mode === 'all') && result.summary.sourcesChecked > 0 && result.summary.sourcesOk === 0) ? 'failed' : result.warnings.length ? 'partial' : 'completed'
    await save({ status, phase: 'finished', result, message: result.warnings.join(' · ').slice(0, 1_000) || null })
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error)
    console.error('Update failed:', message)
    await save({ status: 'failed', phase: 'finished', result, message })
  }
  return result
}
