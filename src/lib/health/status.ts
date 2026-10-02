import { sourceRefreshIntervalMs } from '@/lib/rss/schedule'
export type HealthSource = { id: string; name: string; priority: number; is_active: boolean; last_checked_at: string | null; last_success_at: string | null; last_error: string | null }
export function sourceHealth(source: HealthSource, now = Date.now()) {
  const intervalMs = sourceRefreshIntervalMs(source)
  // The external scheduler runs every 30 minutes and may start late.
  const allowedMs = intervalMs + 35 * 60_000
  const checked = Date.parse(source.last_checked_at ?? '')
  const success = Date.parse(source.last_success_at ?? '')
  const overdueMs = Number.isFinite(checked) ? Math.max(0, now - checked - allowedMs) : null
  const status = !source.is_active ? 'paused' : source.last_error ? 'error' : !Number.isFinite(checked) || !Number.isFinite(success) ? 'unverified' : checked > now || success > now ? 'unknown' : overdueMs && overdueMs > 0 ? 'late' : 'ok'
  return { status, intervalMinutes: intervalMs / 60_000, allowedMinutes: allowedMs / 60_000, overdueMinutes: overdueMs === null ? null : Math.ceil(overdueMs / 60_000) }
}
export function healthSummary(sources: HealthSource[], now = Date.now()) {
  const active = sources.filter(s => s.is_active)
  const issues = active.map(source => ({ ...source, ...sourceHealth(source, now) })).filter(s => s.status !== 'ok')
  const checked = active.map(s => Date.parse(s.last_checked_at ?? '')).filter(t => Number.isFinite(t) && t <= now)
  return { active: active.length, issues, lastCheck: checked.length ? new Date(Math.max(...checked)).toISOString() : null, oldestCheck: checked.length ? new Date(Math.min(...checked)).toISOString() : null }
}
