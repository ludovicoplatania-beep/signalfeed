// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('./components/app-layout', () => ({
  Sidebar: ({ setActiveSection }: { setActiveSection: (s: string) => void }) => <button onClick={() => setActiveSection('feed')}>Archivio test</button>,
  Header: ({ refreshData, refreshing, updateStatus }: { refreshData: () => void; refreshing: boolean; updateStatus: string }) => <div><button disabled={refreshing} onClick={refreshData}>Aggiorna test</button><p>{updateStatus}</p></div>,
}))
vi.mock('./components/feed', () => ({ FeedList: ({ articles }: { articles: { id: string; title: string }[] }) => <div>{articles.map(a => <p key={a.id}>{a.title}</p>)}</div>, SavedView: () => null }))
import HomePage from './components/dashboard'
const initial = { sources: [], articles: [], aiPicks: [], savedArticles: [], trendingTopics: [], digests: [], update: null }
const job = { id: 'update', mode: 'rss', status: 'running', phase: 'sources' }
const json = (data: unknown) => Promise.resolve(new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('refresh user flow', () => {
  it('refreshes the open archive after the background job completes', async () => {
    let refreshed = false
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/data') return json(initial)
      if (url.startsWith('/api/articles')) return json({ articles: [{ id: refreshed ? 'new' : 'old', title: refreshed ? 'Nuova notizia' : 'Vecchia notizia', url: 'https://example.com/a' }], total: 1, nextOffset: 1 })
      if (url === '/api/update-rss') return json({ job })
      if (url === '/api/update-status') { refreshed = true; return json({ job: { ...job, status: 'completed', result: { summary: { newArticles: 1, updatedArticles: 0, sourcesOk: 1, sourcesChecked: 1 } } } }) }
      return json({ success: true })
    }))
    render(<HomePage />)
    fireEvent.click(await screen.findByText('Archivio test'))
    expect(await screen.findByText('Vecchia notizia')).toBeTruthy()
    fireEvent.click(screen.getByText('Aggiorna test'))
    await waitFor(() => expect(screen.getByText('Nuova notizia')).toBeTruthy(), { timeout: 5000 })
    expect(screen.queryByText('Vecchia notizia')).toBeNull()
  })
  it('releases the refresh button after a network error', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => url === '/api/update-rss' ? Promise.reject(new Error('Errore rete')) : json(initial)))
    render(<HomePage />)
    const button = await screen.findByText('Aggiorna test')
    fireEvent.click(button)
    await screen.findByText('Errore rete')
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })
})
