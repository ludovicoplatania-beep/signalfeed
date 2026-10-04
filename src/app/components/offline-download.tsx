'use client'
import { useEffect, useState } from 'react'
import type { Article } from './types'
import { prepareOfflineShell, readOffline, removeOffline, writeOffline, type OfflineArticle } from '@/lib/offline/storage'
export function OfflineDownload({article,translation}:{article:Article;translation?:OfflineArticle['translation']}) {
  const [available,setAvailable]=useState(false)
  const [pending,setPending]=useState(false)
  const [message,setMessage]=useState('')
  useEffect(()=>{let active=true;readOffline(article.id).then(value=>{if(active)setAvailable(Boolean(value))}).catch(()=>{});return()=>{active=false}},[article.id])
  async function download() {
    setPending(true);setMessage('')
    try {
      if(available){await removeOffline(article.id);setAvailable(false);return}
      const response=await fetch(`/api/reader?id=${encodeURIComponent(article.id)}`)
      const data=await response.json()
      if(!response.ok||!data.success)throw new Error(data.message||'Download non riuscito')
      if(!data.body?.trim())throw new Error('Nessun testo disponibile da scaricare')
      await prepareOfflineShell()
      await writeOffline({id:article.id,article,body:data.body,status:data.status,downloadedAt:new Date().toISOString(),...(translation?.original===data.body?{translation}:{})})
      setAvailable(true)
      setMessage(data.status==='partial'?'Scaricato l’estratto disponibile; il testo resta parziale.':'Copia disponibile su questo dispositivo.')
    }catch(error){setMessage(error instanceof Error?error.message:'Download non riuscito')}finally{setPending(false)}
  }
  return <div className="mt-2"><button disabled={pending} onClick={()=>{void download()}} className="min-h-11 rounded-xl border border-[#B88A44]/25 px-3 text-sm text-[#E2C188]">{pending?'Download…':available?'Rimuovi copia offline':'Scarica per offline'}</button>{message&&<p role="status" className="mt-2 text-sm text-neutral-400">{message}</p>}</div>
}
