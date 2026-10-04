import { AudioPlayer } from './audio-player'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock3, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArticleThumbnail, ArticleActions } from './ui'
import { fallbackReader, type ContentStatus } from '@/lib/articles/readerStatus'
import { useLibrary } from './library'
import { readOffline, writeOffline } from '@/lib/offline/storage'
import { OfflineDownload } from './offline-download'
import type { Article, ToggleSave } from './types'

export function ReaderMode({
  article,
  saved,
  toggleSave,
  close,
}: {
  article: Article
  saved: boolean
  toggleSave: ToggleSave
  close: () => void
}) {
  const { entries, update, error: libraryError } = useLibrary()
  const [content, setContent] = useState<{body:string;status:ContentStatus}>(()=>fallbackReader(article.article_content,article.excerpt))
  const [loading,setLoading] = useState(true)
  const [contentError,setContentError] = useState('')
  const [pending,setPending] = useState(false)
  const [translation,setTranslation]=useState<{body:string;original:string;translatedAt:string}|null>(null)
  const [showTranslation,setShowTranslation]=useState(false)
  const [translating,setTranslating]=useState(false)
  const [translationError,setTranslationError]=useState('')
  useEffect(()=>{
    const controller=new AbortController()
    async function load(){
      const offline=await readOffline(article.id).catch(()=>undefined)
      if(controller.signal.aborted)return
      if(offline){setContent({body:offline.body,status:offline.status});setTranslation(offline.translation??null)}
      try{
        const response=await fetch(`/api/reader?id=${encodeURIComponent(article.id)}`,{signal:controller.signal})
        const data=await response.json()
        if(!response.ok||!data.success)throw new Error(data.message||'Testo non disponibile')
        if(controller.signal.aborted)return
        setContent({body:data.body,status:data.status});setContentError(data.message??'')
        if(offline?.translation?.original!==data.body)setTranslation(null)
      }catch(error){if(!controller.signal.aborted)setContentError(offline?'Stai leggendo la copia scaricata su questo dispositivo.':error instanceof Error?error.message:'Testo non disponibile')}
      finally{if(!controller.signal.aborted)setLoading(false)}
    }
    void load()
    return()=>controller.abort()
  },[article.id])
  async function translate(){
    if(translation?.original===content.body){setShowTranslation(true);return}
    setTranslating(true);setTranslationError('')
    try{
      const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({article_id:article.id})})
      const data=await response.json()
      if(!response.ok||!data.success)throw new Error(data.message||'Traduzione non disponibile')
      setContent({body:data.original,status:data.status})
      const value={body:data.body,original:data.original,translatedAt:data.translatedAt}
      setTranslation(value);setShowTranslation(true)
      const offline=await readOffline(article.id)
      if(offline)await writeOffline({...offline,body:data.original,status:data.status,translation:value})
    }catch(error){setTranslationError(error instanceof Error?error.message:'Traduzione non disponibile')}
    finally{setTranslating(false)}
  }
  async function toggleRead(){setPending(true);try{await update(article.id,{read:!entries[article.id]?.read_at})}catch{/* provider shows error */}finally{setPending(false)}}
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.body.style.overflow
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const position = window.scrollY
    document.body.style.overflow = 'hidden'
    const modal = dialog.current
    modal?.showModal()
    return () => { modal?.close(); document.body.style.overflow = previous; window.scrollTo({top:position,behavior:'instant'}); focus?.focus({preventScroll:true}) }
  }, [])
  return (
    <motion.dialog
      ref={dialog}
      aria-labelledby="reader-article-title"
      onCancel={(event) => { event.preventDefault(); close() }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-background p-0 text-foreground  backdrop:bg-surface"
    >

      <div className="relative mx-auto max-w-3xl px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 md:px-8 md:py-8">
        <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <button onClick={close} className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm text-foreground  transition hover:border-line hover:text-foreground">
            <ArrowLeft size={16} />Torna
          </button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line  px-3 py-2.5 text-sm font-medium text-accent  transition hover:border-line sm:order-last">
            <ExternalLink size={16} className="shrink-0" />Fonte originale
          </a>
          <div className="col-span-full flex justify-end sm:ml-auto"><ArticleActions articleId={article.id} saved={saved} onClick={() => toggleSave(article.id)} small /></div>
        </div>

        <article>
          <header className="border-b border-line pb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{article.sources?.name ?? 'Fonte'}</span>
              {article.published_at && <><span>·</span><Clock3 size={14} /><span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: it })}</span></>}
            </div>
            <h1 id="reader-article-title" className="text-[28px] font-semibold leading-tight tracking-tight sm:text-4xl [overflow-wrap:anywhere]">{article.title}</h1>
            {article.image_url && <div className="mt-5 max-w-sm"><ArticleThumbnail imageUrl={article.image_url} /></div>}
          </header>

          <div className="mx-auto max-w-3xl py-6 md:py-8">
            <p role="status" className="mb-5 rounded-xl border border-line p-3 text-sm text-accent">{loading?'Recupero del testo dalla fonte…':content.status==='full'?'Testo completo fornito dalla fonte':content.status==='partial'?'Contenuto parziale · consulta la fonte per il testo integrale':'Testo estratto dalla fonte · completezza non verificata'}</p>
            {contentError&&<p className="mb-5 text-sm text-muted">{contentError}</p>}
            <details className="mb-6 border-y border-line py-1"><summary className="min-h-11 cursor-pointer py-2 text-sm text-accent">Lettura, traduzione e audio</summary><div className="pt-3">        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-foreground"><span>{entries[article.id]?.read_at?'Letto':'Da leggere'}</span><button disabled={pending} onClick={()=>{void toggleRead()}} className="min-h-11 rounded-xl border border-line px-4">{entries[article.id]?.read_at?'Segna da leggere':'Segna letto'}</button>{libraryError&&<p role="alert">{libraryError}</p>}</div>
        {saved&&<div className="mb-4"><OfflineDownload article={article} translation={translation??undefined}/></div>}
            <div className="mb-5 flex flex-wrap gap-3"><button disabled={loading||translating||!content.body} onClick={()=>{void translate()}} aria-pressed={showTranslation} className="min-h-11 rounded-xl border border-line px-4 text-accent">{translating?'Traduzione…':'Traduci in italiano'}</button><button onClick={()=>setShowTranslation(false)} aria-pressed={!showTranslation} className="min-h-11 rounded-xl border border-line px-4">Testo originale</button></div>
            {showTranslation&&translation&&<p className="mb-4 text-sm text-muted">Traduzione IA · può contenere errori · {new Date(translation.translatedAt).toLocaleString('it-IT')}{content.status==='partial'?' · tradotto soltanto il testo parziale disponibile':''}</p>}
            {translationError&&<p role="alert" className="mb-4 text-warning">{translationError}</p>}
            <AudioPlayer key={`${article.id}:${showTranslation}:${loading}:${content.body.length}`} text={loading?'':(showTranslation&&translation?translation.body:content.body)} />
</div></details>
            {content.body ? <div className="whitespace-pre-line text-[18px] leading-[1.8] text-foreground sm:text-[19px]">{showTranslation&&translation?translation.body:content.body}</div> : <p className="text-muted">Testo non disponibile. Puoi aprire la fonte originale.</p>}

          </div>
        </article>
      </div>
    </motion.dialog>
  )
}
