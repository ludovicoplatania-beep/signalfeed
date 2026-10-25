'use client'
import { useSyncExternalStore } from 'react'
function snapshot() {
  if (document.documentElement.dataset.density) return document.documentElement.dataset.density === 'compact'
  try { return localStorage.getItem('athena-density') === 'compact' } catch { return false }
}
function subscribe(notify: () => void) {
  function update(event: StorageEvent) {
    if (event.key !== 'athena-density') return
    document.documentElement.dataset.density = event.newValue === 'compact' ? 'compact' : 'comfortable'
    notify()
  }
  window.addEventListener('storage', update)
  window.addEventListener('athena-density', notify)
  return () => { window.removeEventListener('storage', update); window.removeEventListener('athena-density', notify) }
}
export function useReadingDensity() { return useSyncExternalStore(subscribe, snapshot, () => false) }
export function ReadingDensity() {
  const selected = useReadingDensity()
  function choose(value: boolean) {
    document.documentElement.setAttribute('data-density', value ? 'compact' : 'comfortable')
    try { localStorage.setItem('athena-density', value ? 'compact' : 'comfortable') } catch { /* Storage is optional. */ }
    window.dispatchEvent(new Event('athena-density'))
  }
  return <div role="group" aria-label="Densità del feed" className="flex shrink-0 divide-x divide-line border border-line">{[{label:'Comoda',value:false},{label:'Compatta',value:true}].map(option => <button key={option.label} aria-pressed={selected === option.value} onClick={() => choose(option.value)} className={`te-label relative min-h-11 px-3 ${selected === option.value ? 'text-foreground after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-signal' : 'hover:text-foreground'}`}>{option.label}</button>)}</div>
}
