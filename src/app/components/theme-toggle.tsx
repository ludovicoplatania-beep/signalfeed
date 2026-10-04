'use client'
import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
function snapshot() { return document.documentElement.dataset.theme === 'dark' }
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, () => false)
  function toggle() {
    const theme = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('athena-theme', theme) } catch { /* Storage is optional. */ }
  }
  return <button onClick={toggle} aria-label={dark ? 'Attiva tema chiaro' : 'Attiva tema scuro'} title={dark ? 'Tema chiaro' : 'Tema scuro'} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-accent-soft hover:text-accent">{dark ? <Sun size={20} /> : <Moon size={20} />}</button>
}
