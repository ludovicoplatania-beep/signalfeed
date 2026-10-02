// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))
import Dashboard from './dashboard'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('shows the interface and persisted running job before the job finishes', async () => {
 const data = { sources: [], articles: [], aiPicks: [], savedArticles: [], trendingTopics: [], digests: [], update: {id:'running',mode:'rss',status:'running',phase:'sources',started_at:new Date().toISOString(),updated_at:new Date().toISOString(),result:null,message:null} }
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(data),{status:200})))
 render(<Dashboard />)
 expect(await screen.findByRole('heading',{name:'Il tuo briefing'})).toBeTruthy()
 expect(screen.getByText(/Aggiornamenti.*In corso/)).toBeTruthy()
})
