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
self.addEventListener('push',event=>{
 let payload={};try{payload=event.data?.json()??{}}catch{/* Show a generic visible notification for malformed payloads. */}
 const valid=/^\/\?avviso=[0-9a-f-]{36}$/i.test(payload.url??'')
 event.waitUntil(self.registration.showNotification('Athena · nuovo aggiornamento',{body:'Una notizia corrisponde ai tuoi avvisi. Apri Athena per leggerla.',icon:'/icons/icon-192.png',badge:'/icons/favicon-32.png',tag:typeof payload.tag==='string'?payload.tag.slice(0,100):'athena-update',data:{url:valid?payload.url:'/'}}))
})
self.addEventListener('notificationclick',event=>{
 event.notification.close()
 const path=event.notification.data?.url
 const target=new URL(/^\/\?avviso=[0-9a-f-]{36}$/i.test(path??'')?path:'/',self.location.origin).href
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{
  const existing=windows.find(client=>new URL(client.url).origin===self.location.origin)
  if(existing){await existing.navigate(target);return existing.focus()}
  return self.clients.openWindow(target)
 }))
})
