import {expect,it} from 'vitest'
import {reservationCost,tokenCost} from './cost'
it('prices cached input separately and reserves conservatively',()=>{
 expect(tokenCost(1000000,1000000,500000)).toBe(712500)
 expect(reservationCost({model:'gpt-4o-mini',messages:[{content:'test'}],max_completion_tokens:1000})).toBeGreaterThan(600)
 expect(()=>reservationCost({model:'unknown',messages:[]})).toThrow()
})
