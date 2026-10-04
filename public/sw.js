const CACHE_NAME = 'athena-offline-shell-v1'
const STATIC_ASSETS = ['/offline.html', '/offline.js', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png']
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('athena-') && key !== CACHE_NAME).map(key => caches.delete(key)))))
  self.clients.claim()
})
self.addEventListener('fetch', event => {
  const request=event.request
  const url=new URL(request.url)
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(async()=>{
      const response=await caches.match('/offline.html')
      return response||new Response('Apri Athena online e scarica un articolo prima di scollegarti.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})
    }))
  }else if(STATIC_ASSETS.includes(url.pathname)){
    event.respondWith(caches.open(CACHE_NAME).then(async cache=>await cache.match(request)||fetch(request)))
  }
})
