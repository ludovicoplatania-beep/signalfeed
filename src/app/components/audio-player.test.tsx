// @vitest-environment jsdom
import React from 'react'
import { afterEach,expect,it,vi } from 'vitest'
import { cleanup,fireEvent,render,screen } from '@testing-library/react'
import { AudioPlayer } from './audio-player'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('starts only on request, pauses, resumes and cancels when the reader closes',()=>{
 const synth={cancel:vi.fn(),resume:vi.fn(),pause:vi.fn(),speak:vi.fn(),getVoices:()=>[]}
 vi.stubGlobal('speechSynthesis',synth)
 vi.stubGlobal('SpeechSynthesisUtterance',class{constructor(public text:string){}lang='';rate=1;voice=null;onend=null;onerror=null})
 const view=render(<AudioPlayer text="Una notizia importante"/>);expect(synth.speak).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'Ascolta il testo'}));expect(synth.speak).toHaveBeenCalledOnce()
 fireEvent.click(screen.getByRole('button',{name:'Pausa'}));expect(synth.pause).toHaveBeenCalledOnce()
 fireEvent.click(screen.getByRole('button',{name:'Riprendi audio'}));expect(synth.resume).toHaveBeenCalledTimes(2)
 view.unmount();expect(synth.cancel).toHaveBeenCalledTimes(2)
})
