// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import React from 'react'
import { UpdateHealth } from './update-health'
import type { UpdateJob } from '@/lib/server/pipeline'
afterEach(cleanup)
const job: UpdateJob = { id: 'job', user_id: 'owner', mode: 'rss', status: 'failed', phase: 'finished', started_at: '2026-10-02T15:00:00Z', updated_at: '2026-10-02T15:07:00Z', message: 'Aggiornamento interrotto', result: null }
describe('persistent update health', () => {
  it('renders stored failures even without a manual update action', () => {
    render(<UpdateHealth sources={[]} job={job} now={Date.parse('2026-10-02T16:00:00Z')} error="" />)
    expect(screen.getByText(/Importazione · Fallito/)).toBeTruthy()
    expect(screen.getByText('Aggiornamento interrotto')).toBeTruthy()
  })
  it('shows verification failure separately from an older completed cycle', () => {
    render(<UpdateHealth sources={[]} job={{ ...job, status: 'completed' }} now={Date.now()} error="Connessione non disponibile" />)
    expect(screen.getByText(/Verifica non disponibile/)).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('dati mostrati possono essere precedenti')
  })
})
