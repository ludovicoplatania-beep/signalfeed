// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ArticleFeedbackProvider, FeedbackButtons } from './article-feedback'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('feedback user flow', () => {
  it('saves and undoes a like without opening the article', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const open = vi.fn()
    render(<ArticleFeedbackProvider initial={{}}><div onClick={open}><FeedbackButtons articleId="article" /></div></ArticleFeedbackProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Mi piace' }))
    await screen.findByText('Preferenza salvata. Influenzerà le prossime scelte IA.')
    expect(open).not.toHaveBeenCalled()
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ article_id: 'article', preference: 'like' })
    fireEvent.click(screen.getByRole('button', { name: 'Annulla Mi piace' }))
    await screen.findByText('Preferenza annullata.')
    expect(JSON.parse(fetch.mock.calls[1][1].body).preference).toBeNull()
  })
  it('rolls back failed writes instead of showing a saved like', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
    render(<ArticleFeedbackProvider initial={{}}><FeedbackButtons articleId="article" /></ArticleFeedbackProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Mi piace' }))
    await screen.findByText('Preferenza non salvata. Riprova.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mi piace' }).getAttribute('aria-pressed')).toBe('false'))
  })
})
