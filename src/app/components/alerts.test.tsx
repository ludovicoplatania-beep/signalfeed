// @vitest-environment jsdom
import React from 'react'
import { afterEach,expect,it,vi } from 'vitest'
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import { AlertsPanel } from './alerts'
import { defaultAlertSettings } from '@/lib/alerts/rules'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('persists optional rules without database metadata and does not request push permission',async()=>{
 const requestPermission=vi.fn();vi.stubGlobal('Notification',{requestPermission,permission:'default'})
 const settings={...defaultAlertSettings,user_id:'owner',updated_at:null,enabled_since:'now'}
 const fetcher=vi.fn(async(_url:string,options?:RequestInit)=>new Response(JSON.stringify(options?.method==='POST'?{settings:{...JSON.parse(String(options.body)).settings,updated_at:'saved'}}:{settings,alerts:[],deliveries:[],pushReady:true,publicKey:'key'})))
 vi.stubGlobal('fetch',fetcher);render(<AlertsPanel openReader={()=>{}}/> )
 fireEvent.click(screen.getByRole('button',{name:'Avvisi selettivi +'}))
 await screen.findByLabelText('Abilita avvisi');fireEvent.click(screen.getByLabelText('Intelligenza artificiale'));fireEvent.click(screen.getByLabelText('Abilita avvisi'));fireEvent.click(screen.getByRole('button',{name:'Salva avvisi'}))
 await waitFor(()=>expect(screen.getByText('Avvisi attivi dai prossimi articoli importati.')).toBeTruthy())
 const request=fetcher.mock.calls.find(([,options])=>options?.method==='POST')!
 expect(JSON.parse(String(request[1]?.body))).toEqual({settings:{...defaultAlertSettings,enabled:true,sectors:['ia']},version:null})
 expect(requestPermission).not.toHaveBeenCalled()
})
