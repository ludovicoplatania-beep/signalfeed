'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {FeedList} from './feed'
import type {Article,OpenReader,ToggleSave} from './types'
type EventGroup={id:string;title:string;synopsis:string;created_at:string;updated_at:string;primary_checked_at?:string|null;primary_check_message?:string|null;event_articles?:{article_id:string;language:string}[]}
type Coverage={article_id:string;language:string;focus:string;added_at:string;articles:Article|null}
type Primary={url:string;label:string;article_id:string;checked_at:string}
const languages:Record<string,string>={it:'Italiano',en:'Inglese',fr:'Francese',de:'Tedesco',es:'Spagnolo',other:'Non rilevata'}
export function EventsView({id,savedIds,toggleSave,openReader}:{id?:string;savedIds:Set<string>;toggleSave:ToggleSave;openReader:OpenReader}){
 const [groups,setGroups]=useState<EventGroup[]>([]);const [event,setEvent]=useState<EventGroup|null>(null)
 const [coverage,setCoverage]=useState<Coverage[]>([]);const [primary,setPrimary]=useState<Primary[]>([])
 const [language,setLanguage]=useState('');const [order,setOrder]=useState('newest')
 const [loading,setLoading]=useState(true);const [pending,setPending]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('')
 async function load(signal?:AbortSignal){
  const response=await fetch(id?`/api/events/${id}`:'/api/events',{signal});const data=await response.json()
  if(!response.ok||!data.success)throw new Error(data.message||'Eventi non disponibili')
  if(id){setEvent(data.event);setCoverage(data.coverage);setPrimary(data.primary)}else setGroups(data.events)
 }
 useEffect(()=>{
  const controller=new AbortController()
  fetch(id?`/api/events/${id}`:'/api/events',{signal:controller.signal}).then(async response=>{
   const data=await response.json();if(!response.ok||!data.success)throw new Error(data.message||'Eventi non disponibili');return data
  }).then(data=>{if(controller.signal.aborted)return;if(id){setEvent(data.event);setCoverage(data.coverage);setPrimary(data.primary)}else setGroups(data.events)})
  .catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
  return()=>controller.abort()
 },[id])
 async function refresh(sources=false){setPending(true);setError('');setMessage('');try{const response=await fetch(sources?`/api/events/${id}/sources`:'/api/events',{method:'POST'});const data=await response.json();if(!response.ok||!data.success)throw new Error(data.message||'Aggiornamento non riuscito');setMessage(data.message??(data.skipped?'Nessun nuovo evento condiviso individuato.':`${data.count} gruppi elaborati; le pagine precedenti sono conservate.`));await load()}catch(e){setError(e instanceof Error?e.message:'Errore')}finally{setPending(false)}}
 if(loading)return <p role="status" className="text-neutral-400">Caricamento eventi…</p>
 const available=[...new Set(coverage.map(member=>member.language))]
 const sorted=coverage.filter(member=>!language||member.language===language).sort((a,b)=>{
  const left=Date.parse(a.articles?.published_at??a.added_at);const right=Date.parse(b.articles?.published_at??b.added_at)
  return (order==='oldest'?left-right:right-left)||a.article_id.localeCompare(b.article_id)
 })
 return <div className="space-y-5">
  {error&&<p role="alert" className="rounded-xl border border-amber-400/30 p-3 text-amber-200">{error}</p>}{message&&<p role="status" className="text-neutral-300">{message}</p>}
  {!id?<><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-neutral-400">Più coperture dello stesso fatto, raccolte in pagine che conservano il proprio indirizzo. I temi generali restano nei Temi caldi.</p><button disabled={pending} onClick={()=>{void refresh()}} className="min-h-11 rounded-xl border border-[#B88A44]/30 px-4 text-[#E2C188]">{pending?'Aggiornamento…':'Aggiorna eventi'}</button></div>{!groups.length&&<p className="text-neutral-400">Nessun evento ancora raccolto. Avvia «Aggiorna eventi» per cercare coperture comuni.</p>}<div className="grid gap-4 md:grid-cols-2">{groups.map(group=><Link key={group.id} href={`/eventi/${group.id}`} className="block rounded-3xl border border-[#B88A44]/20 bg-black/35 p-5"><h2 className="text-xl font-medium tracking-tight text-white">{group.title}</h2><p className="mt-3 text-sm leading-6 text-neutral-400">{group.synopsis}</p><p className="mt-3 text-xs text-[#E2C188]">{group.event_articles?.length??0} coperture · aggiornato {new Date(group.updated_at).toLocaleString('it-IT')}</p></Link>)}</div></>:event&&<>
   <Link href="/eventi" className="inline-flex min-h-11 items-center text-[#E2C188]">← Tutti gli eventi</Link>
   <div className="rounded-3xl border border-[#B88A44]/20 bg-black/35 p-5 sm:p-7"><h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{event.title}</h2><p className="mt-4 text-xs uppercase tracking-wider text-[#E2C188]">Sintesi iniziale</p><p className="mt-2 leading-7 text-neutral-300">{event.synopsis}</p><p className="mt-3 text-sm text-neutral-400">{coverage.length} coperture · raccolta creata {new Date(event.created_at).toLocaleString('it-IT')}</p><p className="mt-3 text-xs leading-5 text-neutral-500">Raggruppamento e sintesi IA da titoli ed estratti. Il collegamento descrive uno stesso evento, non certifica accordo tra le fonti. Le lingue sono stimate.</p></div>
   <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg text-white">Fonti primarie e documenti ufficiali</h3><button disabled={pending} onClick={()=>{void refresh(true)}} className="min-h-11 rounded-xl border border-[#B88A44]/25 px-3 text-sm text-[#E2C188]">{pending?'Verifica…':'Verifica fonti primarie'}</button></div><p className="mt-2 text-sm text-neutral-400">Collegamenti ufficiali citati nelle coperture o articoli pubblicati dalla fonte ufficiale. Non sostituiscono la verifica del documento.</p>{event.primary_check_message&&<p className="mt-2 text-sm text-neutral-400">{event.primary_check_message} Verifica: {new Date(event.primary_checked_at!).toLocaleString('it-IT')}</p>}{!primary.length?<p className="mt-3 text-neutral-400">Nessun collegamento ufficiale ancora raccolto.</p>:<ul className="mt-3 space-y-3">{primary.map(link=><li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#E2C188] underline underline-offset-4">{link.label}</a><p className="mt-1 text-xs text-neutral-500">{new URL(link.url).hostname} · citato in «{coverage.find(member=>member.article_id===link.article_id)?.articles?.title??'Copertura collegata'}»</p></li>)}</ul>}</section>
   <div className="grid gap-3 sm:grid-cols-2"><select aria-label="Lingua della copertura" value={language} onChange={e=>setLanguage(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#111] px-3"><option value="">Tutte le lingue</option>{available.map(code=><option key={code} value={code}>{languages[code]}</option>)}</select><select aria-label="Ordine della cronologia" value={order} onChange={e=>setOrder(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#111] px-3"><option value="newest">Pubblicazioni più recenti</option><option value="oldest">Dall’inizio dell’evento</option></select></div>
   <h3 className="text-xl text-white">Cronologia e coperture</h3>
   {sorted.map(member=>member.articles&&<section key={member.article_id} className="space-y-2"><p className="text-sm text-[#E2C188]">{languages[member.language]} · {member.articles.published_at?`pubblicato ${new Date(member.articles.published_at).toLocaleString('it-IT')}`:'Data di pubblicazione non disponibile'} · aggiunto alla raccolta {new Date(member.added_at).toLocaleString('it-IT')}</p>{member.focus&&<p className="text-sm leading-6 text-neutral-400">Taglio della copertura: {member.focus}</p>}<FeedList articles={[member.articles]} savedIds={savedIds} toggleSave={toggleSave} openReader={openReader} title={member.articles.sources?.name??'Fonte'} subtitle="Apri il testo per confrontare questa copertura con le altre."/></section>)}
  </>}
 </div>
}
