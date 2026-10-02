import { describe, expect, it } from 'vitest'
import { isSourceDue, recentIngestionLags } from './schedule'
import type { SourceRecord } from '@/lib/sources/adapters'
const now = Date.parse('2026-10-02T08:00:00Z')
function source(priority: number, checked?: string | null) {
  return { priority, last_checked_at: checked } as SourceRecord
}
describe('scheduled source refresh', () => {
  it('refreshes priority sources after 30 minutes, other sources after 60', () => {
    expect(isSourceDue(source(4, '2026-10-02T07:30:00Z'), now)).toBe(true)
    expect(isSourceDue(source(3, '2026-10-02T07:30:00Z'), now)).toBe(false)
    expect(isSourceDue(source(3, '2026-10-02T07:00:00Z'), now)).toBe(true)
    expect(isSourceDue(source(5, '2026-10-02T07:34:00Z'), now)).toBe(false)
  })
  it('allows a small grace so worker ordering does not double the nominal interval', () => {
    expect(isSourceDue(source(4, '2026-10-02T07:32:00Z'), now)).toBe(true)
    expect(isSourceDue(source(3, '2026-10-02T07:02:00Z'), now)).toBe(true)
  })
  it('does not permanently starve unchecked, malformed or future timestamps', () => {
    for (const checked of [null, undefined, 'broken', '2026-10-03T00:00:00Z']) {
      expect(isSourceDue(source(3, checked), now)).toBe(true)
    }
  })
  it('measures recent first-arrival delay without including old, future or missing dates', () => {
    expect(recentIngestionLags(['2026-10-02T07:45:00Z', null, 'broken', '2026-10-03T00:00:00Z', '2026-09-01T00:00:00Z'], now)).toEqual([900_000])
  })
})
