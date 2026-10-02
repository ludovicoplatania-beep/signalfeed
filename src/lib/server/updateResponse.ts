import { after, NextResponse } from 'next/server'
import { startUpdate, runUpdate, type UpdateMode, type RunUpdateOptions } from './pipeline'

export async function enqueueUpdate(userId: string, mode: UpdateMode, options: RunUpdateOptions = {}) {
  const { claimed, job } = await startUpdate(userId, mode)
  if (claimed) after(() => runUpdate(job, options))
  return NextResponse.json({ success: true, started: claimed, job }, {
    status: 202, headers: { 'Cache-Control': 'private, no-store' },
  })
}
