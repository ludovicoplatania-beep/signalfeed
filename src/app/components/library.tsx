'use client'
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react'
export type LibraryEntry={article_id:string;read_at:string|null;folder:string;tags:string[]}
const LibraryContext=createContext<{entries:Record<string,LibraryEntry>;error:string;update:(id:string,patch:{read?:boolean;folder?:string;tags?:string[]})=>Promise<void>}>({entries:{},error:'',update:async()=>{}})
export function useLibrary(){return useContext(LibraryContext)}
export function LibraryProvider({children}:{children:ReactNode}){
 const [entries,setEntries]=useState<Record<string,LibraryEntry>>({}); const [error,setError]=useState('')
 useEffect(()=>{const controller=new AbortController(); fetch('/api/library',{signal:controller.signal}).then(async response=>{const data=await response.json(); if(!response.ok||!data.success)throw new Error(data.message||'Biblioteca non disponibile'); setEntries(Object.fromEntries(data.entries.map((v:LibraryEntry)=>[v.article_id,v])))}).catch(e=>{if(!controller.signal.aborted)setError(e.message)});return()=>controller.abort()},[])
 async function update(id:string,patch:{read?:boolean;folder?:string;tags?:string[]}){
  try{const response=await fetch('/api/library',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({article_id:id,...patch})}); const data=await response.json();if(!response.ok||!data.success)throw new Error(data.message||'Salvataggio non riuscito');setEntries(old=>({...old,[id]:data.entry}));setError('')}
  catch(e){setError(e instanceof Error?e.message:'Salvataggio non riuscito');throw e}
 }
 return <LibraryContext.Provider value={{entries,error,update}}>{children}</LibraryContext.Provider>
}
export function LibraryEditor({id}:{id:string}){
 const {entries,update}=useLibrary();const entry=entries[id];const [editing,setEditing]=useState(false);const [folder,setFolder]=useState('');const [tags,setTags]=useState('');const [pending,setPending]=useState(false);const [error,setError]=useState('')
 async function save(){setPending(true);try{await update(id,{folder,tags:tags.split(',').map(x=>x.trim()).filter(Boolean)});setEditing(false)}catch(e){setError(e instanceof Error?e.message:'Errore')}finally{setPending(false)}}
 return <div className="mt-2 text-sm text-neutral-400">
  <div className="flex flex-wrap items-center gap-3"><span>{entry?.read_at?'Letto':'Da leggere'}</span>{entry?.folder&&<span>Cartella: {entry.folder}</span>}{entry?.tags.map(tag=><span key={tag}>#{tag}</span>)}<button className="min-h-11 text-[#E2C188]" onClick={()=>{setFolder(entry?.folder??'');setTags(entry?.tags.join(', ')??'');setEditing(!editing)}}>Organizza</button><button className="min-h-11" onClick={()=>{void update(id,{read:!entry?.read_at}).catch(()=>{})}}>{entry?.read_at?'Segna da leggere':'Segna letto'}</button></div>
  {editing&&<div className="space-y-3 rounded-xl border border-white/10 p-3"><label className="block">Cartella<input aria-label="Cartella articolo" maxLength={80} value={folder} onChange={e=>setFolder(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg bg-black/50 px-3"/></label><label className="block">Tag, separati da virgole<input aria-label="Tag articolo" value={tags} onChange={e=>setTags(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg bg-black/50 px-3"/></label><button disabled={pending} onClick={()=>{void save()}} className="min-h-11 rounded-lg border border-[#B88A44]/30 px-4">{pending?'Salvataggio…':'Salva organizzazione'}</button>{error&&<p role="alert">{error}</p>}</div>}
 </div>
}
