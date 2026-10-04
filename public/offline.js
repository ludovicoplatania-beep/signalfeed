'use strict'
const element = id => document.getElementById(id)
let copies = []
let selected
function database() { return new Promise((resolve,reject) => {
  const request=indexedDB.open('athena-offline-v1',1)
  request.onupgradeneeded=()=>request.result.createObjectStore('articles',{keyPath:'id'})
  request.onsuccess=()=>resolve(request.result)
  request.onerror=()=>reject(new Error('Memoria offline non disponibile'))
}) }
async function operation(mode,run){const db=await database();return new Promise((resolve,reject)=>{
  const tx=db.transaction('articles',mode);const request=run(tx.objectStore('articles'))
  tx.oncomplete=()=>{db.close();resolve(request.result)}
  tx.onabort=()=>{db.close();reject(new Error('Operazione offline non riuscita'))}
})}
function report(error){element('error').textContent=error.message||'Operazione non riuscita'}
function button(text,action){const node=document.createElement('button');node.textContent=text;node.onclick=()=>Promise.resolve().then(action).catch(report);return node}
function render(){
  const query=element('search').value.toLocaleLowerCase()
  const filtered=copies.filter(item=>`${item.article.title} ${item.article.sources?.name||''} ${item.body} ${item.translation?.body||''}`.toLocaleLowerCase().includes(query))
  element('list').replaceChildren()
  if(!filtered.length){element('list').textContent='Nessuna copia disponibile. Scarica gli articoli dai Salvati mentre sei online.';return}
  for(const item of filtered){const card=document.createElement('div');card.className='card'
    const heading=document.createElement('h2');heading.textContent=item.article.title
    const meta=document.createElement('p');meta.className='muted';meta.textContent=`${item.article.sources?.name||'Fonte'} · scaricato ${new Date(item.downloadedAt).toLocaleString('it-IT')}`
    const row=document.createElement('div');row.className='row'
    row.append(button('Leggi offline',()=>open(item)),button('Rimuovi copia',async()=>{await operation('readwrite',store=>store.delete(item.id));await load()}))
    card.append(heading,meta,row);element('list').append(card)
  }
}
function open(item){selected=item;element('list-view').hidden=true;element('reader').hidden=false;element('back').hidden=false
  element('title').textContent=item.article.title
  element('meta').textContent=`${item.article.sources?.name||'Fonte'} · copia del ${new Date(item.downloadedAt).toLocaleString('it-IT')}`
  element('status').textContent=item.status==='full'?'Testo completo fornito dalla fonte':item.status==='partial'?'Contenuto parziale · solo il testo disponibile al download':'Testo estratto · completezza non verificata'
  const url=new URL(item.article.url)
  element('source').removeAttribute('href')
  if(['http:','https:'].includes(url.protocol))element('source').href=url.href
  element('translated').hidden=!item.translation||item.translation.original!==item.body
  original();window.scrollTo(0,0)
}
function original(){element('body').textContent=selected.body;element('translation-note').hidden=true;element('original').setAttribute('aria-pressed','true');element('translated').setAttribute('aria-pressed','false')}
async function load(){copies=await operation('readonly',store=>store.getAll());copies.sort((a,b)=>b.downloadedAt.localeCompare(a.downloadedAt));render()}
element('back').onclick=()=>{element('list-view').hidden=false;element('reader').hidden=true;element('back').hidden=true;selected=undefined;void load().catch(report)}
element('original').onclick=original
element('translated').onclick=()=>{element('body').textContent=selected.translation.body;element('translation-note').hidden=false;element('original').setAttribute('aria-pressed','false');element('translated').setAttribute('aria-pressed','true')}
element('search').oninput=render
element('clear').onclick=async()=>{try{await operation('readwrite',store=>store.clear());await load()}catch(error){report(error)}}
element('persist').onclick=async()=>{try{const granted=await navigator.storage?.persist?.();element('storage').textContent=granted?'Download protetti dalla pulizia automatica.':'Protezione non concessa dal browser. Le copie restano disponibili finché il browser le conserva.'}catch(error){report(error)}}
function connection(){element('connection').textContent=navigator.onLine?'Biblioteca locale · rete disponibile':'Sei offline · lettura delle copie scaricate'}
window.addEventListener('online',connection);window.addEventListener('offline',connection);connection()
void load().catch(report)
