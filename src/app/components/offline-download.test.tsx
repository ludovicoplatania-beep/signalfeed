// @vitest-environment jsdom
import React from 'react'
import {afterEach,expect,it,vi} from 'vitest'
import {act,cleanup,render,screen,waitFor} from '@testing-library/react'
const read=vi.hoisted(()=>vi.fn())
vi.mock('@/lib/offline/storage',()=>({readOffline:read,writeOffline:vi.fn(),removeOffline:vi.fn(),prepareOfflineShell:vi.fn()}))
import {OfflineDownload} from './offline-download'
afterEach(cleanup)
it('updates every download control when the reader changes the local copy',async()=>{
 read.mockResolvedValue(undefined)
 const article={id:'a',title:'Article',url:'https://example.com/a',excerpt:null,image_url:null,article_content:null,published_at:null,sources:null}
 render(<><OfflineDownload article={article}/><OfflineDownload article={article}/></>)
 expect(screen.getAllByRole('button',{name:'Scarica per offline'})).toHaveLength(2)
 read.mockResolvedValue({id:'a'})
 act(()=>{window.dispatchEvent(new Event('athena-offline-changed'))})
 await waitFor(()=>expect(screen.getAllByRole('button',{name:'Rimuovi copia offline'})).toHaveLength(2))
})
