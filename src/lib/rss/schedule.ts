import type { SourceRecord } from '@/lib/sources/adapters'

// Priority 4–5 sources every 30 minutes; other sources every hour.
// A three-minute grace absorbs worker ordering and minor scheduler jitter.
// These are due thresholds, not a guarantee about the external scheduler.
export function sourceRefreshIntervalMs(source: Pick<SourceRecord, 'priority'>) {
  return (source.priority >= 4 ? 30 : 60) * 60_000
}

export function isSourceDue(source: SourceRecord, now = Date.now()) {
  const checked = Date.parse(source.last_checked_at ?? '')
  return !Number.isFinite(checked) || checked > now || now - checked >= sourceRefreshIntervalMs(source) - 180_000
}

export function recentIngestionLags(publishedDates: (string | null)[], observedAt = Date.now()) {
  // Exclude backfills, missing dates and future dates from the freshness sample.
  return publishedDates.flatMap(date => {
    const published = Date.parse(date ?? '')
    const lag = observedAt - published
    return Number.isFinite(published) && lag >= 0 && lag <= 86_400_000 ? [lag] : []
  })
}
