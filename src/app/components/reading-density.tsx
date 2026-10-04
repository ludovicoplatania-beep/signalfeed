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
  return <div role="group" aria-label="Densità del feed" className="flex shrink-0 gap-1 text-xs">{[{label:'Comoda',value:false},{label:'Compatta',value:true}].map(option => <button key={option.label} aria-pressed={selected === option.value} onClick={() => choose(option.value)} className={`min-h-11 rounded-lg px-3 ${selected === option.value ? 'bg-accent-soft text-accent' : 'text-muted'}`}>{option.label}</button>)}</div>
}
