import {expect,it} from 'vitest'
import {translationChunks} from './translation'
it('preserves all source text, paragraph boundaries and chunk order',()=>{
 const body=('Prima riga con nomi e numeri 123.\n\nSeconda riga.\n\n').repeat(1000)
 const chunks=translationChunks(body)
 expect(chunks.join('')).toBe(body)
 expect(chunks.every(chunk=>chunk.length<=5000)).toBe(true)
 expect(translationChunks('Testo breve')).toEqual(['Testo breve'])
})
