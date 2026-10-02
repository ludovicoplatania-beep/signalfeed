import { describe, expect, it } from 'vitest'
import { healthSummary, sourceHealth, type HealthSource } from './status'
const now = Date.parse('2026-10-02T16:00:00Z')
const source: HealthSource = { id: 'one', name: 'Fonte', priority: 3, is_active: true, last_checked_at: '2026-10-02T15:00:00Z', last_success_at: '2026-10-02T15:00:00Z', last_error: null }
describe('source health relative to schedule', () => {
  it('allows scheduler jitter but flags hourly sources long before 36 hours', () => {
    expect(sourceHealth(source, now).status).toBe('ok')
    expect(sourceHealth({ ...source, last_checked_at: '2026-10-02T14:00:00Z' }, now)).toMatchObject({ status: 'late', overdueMinutes: 25 })
    expect(sourceHealth({ ...source, priority: 5, last_checked_at: '2026-10-02T14:50:00Z' }, now)).toMatchObject({ status: 'late', overdueMinutes: 5 })
  })
  it('does not hide errors behind recent successes or treat paused sources as incidents', () => {
    const broken = { ...source, last_error: 'HTTP 403' }
    expect(sourceHealth(broken, now).status).toBe('error')
    expect(healthSummary([{ ...broken, is_active: false }, source], now).issues).toHaveLength(0)
  })
  it('keeps missing and future timestamps visibly uncertain', () => {
    expect(sourceHealth({ ...source, last_checked_at: null }, now).status).toBe('unverified')
    expect(sourceHealth({ ...source, last_success_at: '2026-10-03T15:00:00Z' }, now).status).toBe('unknown')
  })
})
