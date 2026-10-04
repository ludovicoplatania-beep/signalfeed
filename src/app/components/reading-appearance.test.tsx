// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ThemeToggle } from './theme-toggle'
import { ReadingDensity } from './reading-density'
import { FeedList } from './feed'

afterEach(() => { cleanup(); localStorage.clear(); document.documentElement.removeAttribute('data-theme'); document.documentElement.removeAttribute('data-density') })
it('keeps the chosen theme after the controls are mounted again', async () => {
  document.documentElement.dataset.theme = 'light'
  const view = render(<ThemeToggle />)
  fireEvent.click(screen.getByRole('button', { name: 'Attiva tema scuro' }))
  await screen.findByRole('button', { name: 'Attiva tema chiaro' })
  expect(localStorage.getItem('athena-theme')).toBe('dark')
  view.unmount()
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: 'Attiva tema chiaro' })).toBeTruthy()
})
it('applies compact mode to mounted feeds and retains full titles and save controls', async () => {
  const article = { id: 'one', title: 'Titolo completo della notizia', url: 'https://example.com', excerpt: 'Estratto da nascondere', image_url: null, article_content: null, published_at: null, sources: null }
  render(<><ReadingDensity /><FeedList showDensity={false} articles={[article]} title="Notizie" subtitle="" savedIds={new Set()} toggleSave={vi.fn()} openReader={vi.fn()} /></>)
  expect(screen.getByText(article.excerpt)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Compatta' }))
  await waitFor(() => expect(screen.queryByText(article.excerpt)).toBeNull())
  expect(screen.getByText(article.title)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Salva articolo' })).toBeTruthy()
  expect(localStorage.getItem('athena-density')).toBe('compact')
})
