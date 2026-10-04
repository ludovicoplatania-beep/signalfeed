'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {FeedList} from './feed'
import type {Article,OpenReader,ToggleSave} from './types'
type EventGroup={id:string;title:string;synopsis:string;created_at:string;updated_at:string;primary_checked_at?:string|null;primary_check_message?:string|null;event_articles?:{article_id:string;language:string}[]}
type Coverage={article_id:string;language:string;focus:string;added_at:string;articles:Article|null}
type Primary={url:string;label:string;article_id:string;checked_at:string}
const languages:Record<string,string>={it:'Italiano',en:'Inglese',fr:'Francese',de:'Tedesco',es:'Spagnolo',other:'Non rilevata'}
export function EventsView({id,query='',savedIds,toggleSave,openReader}:{id?:string;query?:string;savedIds:Set<string>;toggleSave:ToggleSave;openReader:OpenReader}){
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
 if(loading)return <p role="status" className="text-muted">Caricamento eventi…</p>
 const search=query.trim().toLocaleLowerCase()
 const listed=groups.filter(group=>`${group.title} ${group.synopsis}`.toLocaleLowerCase().includes(search))
 const available=[...new Set(coverage.map(member=>member.language))]
 const sorted=coverage.filter(member=>(!language||member.language===language)&&`${member.articles?.title??''} ${member.articles?.excerpt??''} ${member.articles?.sources?.name??''} ${member.focus}`.toLocaleLowerCase().includes(search)).sort((a,b)=>{
  const left=Date.parse(a.articles?.published_at??a.added_at);const right=Date.parse(b.articles?.published_at??b.added_at)
  return (order==='oldest'?left-right:right-left)||a.article_id.localeCompare(b.article_id)
 })
 return <div className="space-y-5">
  {error&&<p role="alert" className="rounded-xl border border-amber-400/30 p-3 text-warning">{error}</p>}{message&&<p role="status" className="text-foreground">{message}</p>}
  {!id?<><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-muted">Più coperture dello stesso fatto, raccolte in pagine che conservano il proprio indirizzo. I temi generali restano nei Temi caldi.</p><button disabled={pending} onClick={()=>{void refresh()}} className="min-h-11 rounded-xl border border-line px-4 text-accent">{pending?'Aggiornamento…':'Aggiorna eventi'}</button></div>{!groups.length&&<p className="text-muted">Nessun evento ancora raccolto. Avvia «Aggiorna eventi» per cercare coperture comuni.</p>}{Boolean(groups.length)&&!listed.length&&<p className="text-muted">Nessun evento corrisponde alla ricerca.</p>}<div className="grid gap-4 md:grid-cols-2">{listed.map(group=><Link key={group.id} href={`/eventi/${group.id}`} className="block rounded-2xl border border-line bg-surface p-5"><h2 className="text-xl font-medium tracking-tight text-foreground">{group.title}</h2><p className="mt-3 text-sm leading-6 text-muted">{group.synopsis}</p><p className="mt-3 text-xs text-accent">{group.event_articles?.length??0} coperture · aggiornato {new Date(group.updated_at).toLocaleString('it-IT')}</p></Link>)}</div></>:event&&<>
   <Link href="/eventi" className="inline-flex min-h-11 items-center text-accent">← Tutti gli eventi</Link>
   <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7"><h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{event.title}</h2><p className="mt-4 text-xs uppercase tracking-wider text-accent">Sintesi iniziale</p><p className="mt-2 leading-7 text-foreground">{event.synopsis}</p><p className="mt-3 text-sm text-muted">{coverage.length} coperture · raccolta creata {new Date(event.created_at).toLocaleString('it-IT')}</p><p className="mt-3 text-xs leading-5 text-muted">Raggruppamento e sintesi IA da titoli ed estratti. Il collegamento descrive uno stesso evento, non certifica accordo tra le fonti. Le lingue sono stimate.</p></div>
   <section className="rounded-2xl border border-line bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg text-foreground">Fonti primarie e documenti ufficiali</h3><button disabled={pending} onClick={()=>{void refresh(true)}} className="min-h-11 rounded-xl border border-line px-3 text-sm text-accent">{pending?'Verifica…':'Verifica fonti primarie'}</button></div><p className="mt-2 text-sm text-muted">Collegamenti ufficiali citati nelle coperture o articoli pubblicati dalla fonte ufficiale. Non sostituiscono la verifica del documento.</p>{event.primary_check_message&&<p className="mt-2 text-sm text-muted">{event.primary_check_message} Verifica: {new Date(event.primary_checked_at!).toLocaleString('it-IT')}</p>}{!primary.length?<p className="mt-3 text-muted">Nessun collegamento ufficiale ancora raccolto.</p>:<ul className="mt-3 space-y-3">{primary.map(link=><li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">{link.label}</a><p className="mt-1 text-xs text-muted">{new URL(link.url).hostname} · citato in «{coverage.find(member=>member.article_id===link.article_id)?.articles?.title??'Copertura collegata'}»</p></li>)}</ul>}</section>
   <div className="grid gap-3 sm:grid-cols-2"><select aria-label="Lingua della copertura" value={language} onChange={e=>setLanguage(e.target.value)} className="min-h-11 rounded-xl border border-line bg-background px-3"><option value="">Tutte le lingue</option>{available.map(code=><option key={code} value={code}>{languages[code]}</option>)}</select><select aria-label="Ordine della cronologia" value={order} onChange={e=>setOrder(e.target.value)} className="min-h-11 rounded-xl border border-line bg-background px-3"><option value="newest">Pubblicazioni più recenti</option><option value="oldest">Dall’inizio dell’evento</option></select></div>
   <h3 className="text-xl text-foreground">Cronologia e coperture</h3>{!sorted.length&&<p className="text-muted">Nessuna copertura corrisponde ai filtri.</p>}
   {sorted.map(member=>member.articles&&<section key={member.article_id} className="space-y-2"><p className="text-sm text-accent">{languages[member.language]} · {member.articles.published_at?`pubblicato ${new Date(member.articles.published_at).toLocaleString('it-IT')}`:'Data di pubblicazione non disponibile'} · aggiunto alla raccolta {new Date(member.added_at).toLocaleString('it-IT')}</p>{member.focus&&<p className="text-sm leading-6 text-muted">Taglio della copertura: {member.focus}</p>}<FeedList showDensity={false} articles={[member.articles]} savedIds={savedIds} toggleSave={toggleSave} openReader={openReader} title={member.articles.sources?.name??'Fonte'} subtitle="Apri il testo per confrontare questa copertura con le altre."/></section>)}
  </>}
 </div>
}
