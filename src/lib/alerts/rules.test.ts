import { expect,it } from 'vitest'
import { alertCandidate,defaultAlertSettings,isQuiet,matchesKeyword,validPushEndpoint } from './rules'
import { speechChunks } from '@/lib/audio/chunks'
const now=Date.parse('2026-10-04T10:00:00Z')
const article={title:'OpenAI annuncia un nuovo modello di intelligenza artificiale',excerpt:null,published_at:new Date(now-1000).toISOString(),created_at:new Date(now).toISOString()}
it('requires configured themes, fresh publication and concrete development',()=>{
 const settings={...defaultAlertSettings,sectors:['ia']}
 expect(alertCandidate(article,settings,now)).not.toBeNull()
 expect(alertCandidate({...article,title:'OpenAI: recensione del nuovo modello'},settings,now)).toBeNull()
 expect(alertCandidate({...article,published_at:'2026-09-30'},settings,now)).toBeNull()
 expect(alertCandidate(article,{...settings,sectors:['videogiochi']},now)).toBeNull()
 expect(matchesKeyword('OpenAI annuncia un modello','Open')).toBe(false)
})
it('uses local quiet hours including midnight and DST transitions',()=>{
 expect(isQuiet(defaultAlertSettings,new Date('2026-10-04T21:00:00Z'))).toBe(true)
 expect(isQuiet(defaultAlertSettings,new Date('2026-10-04T05:59:00Z'))).toBe(true)
 expect(isQuiet(defaultAlertSettings,new Date('2026-10-04T06:00:00Z'))).toBe(false)
 expect(isQuiet(defaultAlertSettings,new Date('2026-10-25T06:30:00Z'))).toBe(true)
 expect(isQuiet({...defaultAlertSettings,quiet_start:8,quiet_end:8})).toBe(false)
})
it('accepts only recognized push services and rejects credentials, ports and spoofing',()=>{
 expect(validPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
 for(const url of ['http://fcm.googleapis.com/fcm/send/a','https://fcm.googleapis.com.evil.test/send/a','https://user@fcm.googleapis.com/send/a','https://127.0.0.1/send/a','https://web.push.apple.com:444/send/a'])expect(validPushEndpoint(url)).toBe(false)
})
it('splits long speech without dropping words or exceeding the voice chunk limit',()=>{
 const text=('Notizia importante. '.repeat(100)+'A'.repeat(700)).trim();const chunks=speechChunks(text)
 expect(chunks.every(chunk=>chunk.length<=240&&chunk.length>0)).toBe(true)
 expect(chunks.join('').replace(/\s/g,'')).toBe(text.replace(/\s/g,''))
 expect(speechChunks('')).toEqual([])
})
