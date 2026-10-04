import { AudioPlayer } from './audio-player'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock3, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArticleImage, ArticleActions } from './ui'
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
      className="fixed inset-0 z-[70] m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-[#070708]/96 p-0 text-white backdrop-blur-2xl backdrop:bg-black/70"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,154,82,0.14),transparent_34%),radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%)]" />

      <div className="relative mx-auto max-w-6xl px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 md:px-10 md:py-10">
        <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <button onClick={close} className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/45 px-4 py-2.5 text-sm text-neutral-300 backdrop-blur-xl transition hover:border-[#B88A44]/30 hover:text-white">
            <ArrowLeft size={16} />Torna
          </button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#B88A44]/25 bg-[linear-gradient(180deg,rgba(197,154,82,0.20),rgba(0,0,0,0.35))] px-3 py-2.5 text-sm font-medium text-[#E2C188] backdrop-blur-xl transition hover:border-[#C59A52]/50 sm:order-last">
            <ExternalLink size={16} className="shrink-0" />Fonte originale
          </a>
          <div className="col-span-full flex justify-end sm:ml-auto"><ArticleActions articleId={article.id} saved={saved} onClick={() => toggleSave(article.id)} small /></div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-300"><span>{entries[article.id]?.read_at?'Letto':'Da leggere'}</span><button disabled={pending} onClick={()=>{void toggleRead()}} className="min-h-11 rounded-xl border border-white/10 px-4">{entries[article.id]?.read_at?'Segna da leggere':'Segna letto'}</button>{libraryError&&<p role="alert">{libraryError}</p>}</div>
        {saved&&<div className="mb-4"><OfflineDownload article={article} translation={translation??undefined}/></div>}
        <article className="overflow-hidden rounded-3xl border border-[#B88A44]/14 bg-black/45 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="relative min-h-[240px] overflow-hidden md:h-[500px]">
            <ArticleImage imageUrl={article.image_url} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(197,154,82,0.20),transparent_32%),radial-gradient(circle_at_15%_12%,rgba(139,92,246,0.20),transparent_28%)]" />

            <div className="relative px-5 pb-5 pt-24 md:absolute md:bottom-0 md:left-0 md:right-0 md:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-[#B88A44]/20 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#E2C188] backdrop-blur-xl">
                  {article.sources?.name ?? 'Fonte'}
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/35 px-3 py-1 text-xs text-neutral-400 backdrop-blur-xl">
                  <Clock3 size={13} />
                  {article.published_at
                    ? formatDistanceToNow(new Date(article.published_at), {
                        addSuffix: true,
                        locale: it,
                      })
                    : 'Data non disponibile'}
                </div>
              </div>

              <h1 id="reader-article-title" className="max-w-5xl text-2xl font-semibold [overflow-wrap:anywhere] leading-[1.12] sm:text-3xl tracking-[-0.06em] text-white md:text-5xl lg:text-6xl">
                {article.title}
              </h1>
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-5 py-9 md:px-0 md:py-14">
            <p role="status" className="mb-5 rounded-xl border border-[#B88A44]/20 p-3 text-sm text-[#E2C188]">{loading?'Recupero del testo dalla fonte…':content.status==='full'?'Testo completo fornito dalla fonte':content.status==='partial'?'Contenuto parziale · consulta la fonte per il testo integrale':'Testo estratto dalla fonte · completezza non verificata'}</p>
            {contentError&&<p className="mb-5 text-sm text-neutral-400">{contentError}</p>}
            <div className="mb-5 flex flex-wrap gap-3"><button disabled={loading||translating||!content.body} onClick={()=>{void translate()}} aria-pressed={showTranslation} className="min-h-11 rounded-xl border border-[#B88A44]/30 px-4 text-[#E2C188]">{translating?'Traduzione…':'Traduci in italiano'}</button><button onClick={()=>setShowTranslation(false)} aria-pressed={!showTranslation} className="min-h-11 rounded-xl border border-white/15 px-4">Testo originale</button></div>
            {showTranslation&&translation&&<p className="mb-4 text-sm text-neutral-400">Traduzione IA · può contenere errori · {new Date(translation.translatedAt).toLocaleString('it-IT')}{content.status==='partial'?' · tradotto soltanto il testo parziale disponibile':''}</p>}
            {translationError&&<p role="alert" className="mb-4 text-amber-300">{translationError}</p>}
            <AudioPlayer key={`${article.id}:${showTranslation}:${loading}:${content.body.length}`} text={loading?'':(showTranslation&&translation?translation.body:content.body)} />
            {content.body ? <div className="whitespace-pre-line text-lg leading-9 text-neutral-300">{showTranslation&&translation?translation.body:content.body}</div> : <p className="text-neutral-400">Testo non disponibile. Puoi aprire la fonte originale.</p>}

          </div>
        </article>
      </div>
    </motion.dialog>
  )
}
