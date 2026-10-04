'use client'
import { useEffect,useRef,useState } from 'react'
import { speechChunks } from '@/lib/audio/chunks'
export function AudioPlayer({text,label='Ascolta il testo'}:{text:string;label?:string}){
 const [state,setState]=useState<'stopped'|'playing'|'paused'>('stopped'),[language,setLanguage]=useState('it-IT'),[rate,setRate]=useState(1),[total,setTotal]=useState(0),[progress,setProgress]=useState(0),[message,setMessage]=useState('')
 const generation=useRef(0),utterance=useRef<SpeechSynthesisUtterance|null>(null),chunks=useRef<string[]>([])
 function stop(){generation.current++;if('speechSynthesis'in window)window.speechSynthesis.cancel();utterance.current=null;setState('stopped');setProgress(0)}
 useEffect(()=>{const token=generation;return()=>{token.current++;if('speechSynthesis'in window)window.speechSynthesis.cancel();utterance.current=null}},[text])
 function play(){
  if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){setMessage('Lettura audio non supportata da questo browser.');return}
  const synth=window.speechSynthesis
  if(state==='paused'){synth.resume();setState('playing');return}
  synth.cancel();synth.resume();chunks.current=speechChunks(text);if(!chunks.current.length)return
  const run=++generation.current;setMessage('');setTotal(chunks.current.length);setProgress(0);setState('playing')
  function next(index:number){if(run!==generation.current)return;if(index>=chunks.current.length){utterance.current=null;setState('stopped');setMessage('Lettura completata.');return}
   const speech=new SpeechSynthesisUtterance(chunks.current[index]);utterance.current=speech;speech.lang=language;speech.rate=rate
   const voices=synth.getVoices();speech.voice=voices.find(v=>v.lang===language&&v.localService)??voices.find(v=>v.lang===language)??null
   speech.onend=()=>{if(run===generation.current){setProgress(index+1);next(index+1)}}
   speech.onerror=event=>{if(run!==generation.current||event.error==='canceled'||event.error==='interrupted')return;generation.current++;setState('stopped');setMessage('La voce del dispositivo ha interrotto la lettura. Puoi riprovare o cambiare lingua.')}
   synth.speak(speech)
  }
  next(0)
 }
 const button='min-h-11 rounded-xl border border-[#B88A44]/25 px-4 py-2 text-sm text-[#E2C188] disabled:opacity-40'
 return <section aria-label="Lettura audio" className="mb-5 rounded-2xl border border-[#B88A44]/20 p-3">
  <div className="flex flex-wrap gap-2"><button className={button} disabled={!text||state==='playing'} onClick={play}>{state==='paused'?'Riprendi audio':label}</button><button className={button} disabled={state!=='playing'} onClick={()=>{window.speechSynthesis.pause();setState('paused')}}>Pausa</button><button className={button} disabled={state==='stopped'} onClick={stop}>Ferma audio</button></div>
  <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs text-neutral-400">Lingua della voce<select aria-label="Lingua della voce" className="min-h-11 w-full rounded-xl bg-[#111015] px-3 text-sm" value={language} disabled={state!=='stopped'} onChange={e=>setLanguage(e.target.value)}>{[['it-IT','Italiano'],['en-US','Inglese'],['fr-FR','Francese'],['de-DE','Tedesco'],['es-ES','Spagnolo']].map(([value,name])=><option value={value} key={value}>{name}</option>)}</select></label><label className="text-xs text-neutral-400">Velocità<select aria-label="Velocità audio" className="min-h-11 w-full rounded-xl bg-[#111015] px-3 text-sm" value={rate} disabled={state!=='stopped'} onChange={e=>setRate(Number(e.target.value))}>{[0.75,1,1.25,1.5].map(value=><option value={value} key={value}>{value}×</option>)}</select></label></div>
  <p className="mt-2 text-xs leading-5 text-neutral-400">Voce del dispositivo · legge il testo visualizzato, compresa la traduzione. Disponibilità offline e riproduzione a schermo spento dipendono dal dispositivo.</p>
  <p role="status" className="mt-2 text-xs text-neutral-300">{message||(state!=='stopped'?`${state==='paused'?'In pausa':'In lettura'} · ${progress}/${total} parti`:'Audio facoltativo · avvio manuale')}</p>
 </section>
}
