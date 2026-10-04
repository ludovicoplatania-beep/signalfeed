// @vitest-environment jsdom
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {CostBackup} from './cost-backup'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('requires a validated preview before applying a restore',async()=>{
 const calls:unknown[]=[]
 vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{if(url==='/api/costs')return {ok:true,json:async()=>({budget:{enabled:false,monthly_limit_microusd:5000000},measured_microusd:0,uncertain_microusd:0,reserved_microusd:0,attempts:0,tracking_since:null,stages:{}})};calls.push(JSON.parse(String(options?.body)));return {ok:true,json:async()=>({counts:{sources:1,saved:1},fingerprint:'hash'})}}))
 render(<CostBackup onChanged={()=>{}}/>);fireEvent.click(screen.getByRole('button',{name:'Costi IA e backup'}));await screen.findByText('Attiva tetto mensile IA')
 expect(screen.queryByRole('button',{name:'Ripristina dati mancanti'})).toBeNull()
 const file=new File(['{}'],'backup.json',{type:'application/json'});Object.defineProperty(file,'text',{value:async()=>'{}'})
 fireEvent.change(screen.getByLabelText('File backup'),{target:{files:[file]}})
 await screen.findByText('Anteprima ripristino');expect(calls).toEqual([{backup:{},apply:false}])
 fireEvent.click(screen.getByRole('button',{name:'Ripristina dati mancanti'}));await waitFor(()=>expect(calls).toHaveLength(2));expect(calls[1]).toEqual({backup:{},apply:true,fingerprint:'hash'})
})
