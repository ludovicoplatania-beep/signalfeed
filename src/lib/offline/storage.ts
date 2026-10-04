import type { Article } from '@/app/components/types'
import type { ContentStatus } from '@/lib/articles/readerStatus'
export type OfflineArticle = { id: string; article: Article; body: string; status: ContentStatus; downloadedAt: string; translation?: { body: string; original: string; translatedAt: string } }
export const OFFLINE_DB = 'athena-offline-v1'
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('articles', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Memoria offline non disponibile'))
  })
}
async function operation<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('articles', mode)
    const request = run(tx.objectStore('articles'))
    tx.oncomplete = () => { db.close(); resolve(request.result) }
    tx.onabort = () => { db.close(); reject(new Error('Copia offline non salvata: controlla lo spazio disponibile')) }
    tx.onerror = () => { /* onabort reports failed transaction */ }
  })
}
export function readOffline(id: string) { return operation<OfflineArticle | undefined>('readonly', store => store.get(id)) }
export function listOffline() { return operation<OfflineArticle[]>('readonly', store => store.getAll()) }
export function writeOffline(entry: OfflineArticle) { return operation('readwrite', store => store.put(entry)) }
export function removeOffline(id: string) { return operation('readwrite', store => store.delete(id)) }
export function clearOffline() { return operation('readwrite', store => store.clear()) }
export async function prepareOfflineShell() {
  if (!('serviceWorker' in navigator) || !('caches' in window)) throw new Error('Questo browser non supporta la lettura offline')
  await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const cache = await caches.open('athena-offline-shell-v1')
  await cache.addAll(['/offline.html', '/offline.js'])
}
