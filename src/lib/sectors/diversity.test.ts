import { describe, expect, it } from 'vitest'
import { automaticPicks } from '@/lib/ai/ranking'
import type { Feedback } from '@/lib/ai/preferences'
import { eligibleSectorArticles, publisherKey, sameSectorEvent, selectSectorPicks, type SectorCandidate } from './diversity'
const article = (id: string, publisher: string, title = `Videogioco numero ${id}: nuova modalità`): SectorCandidate => ({id,title,publisher_key:publisher,source_id:`${publisher}-feed`,source_name:publisher,source_priority:3,url:`https://${publisher}.test/${id}`,excerpt:null,article_content:null,published_at:new Date().toISOString(),created_at:new Date().toISOString()})
const choose = (items: SectorCandidate[]) => selectSectorPicks([],items,[],new Set(),[],7)

describe('sector publisher variety', () => {
  it('counts multiple feeds and subdomains of a publisher only once', () => {
    expect(publisherKey('https://www.example.co.uk/news')).toBe('example.co.uk')
    expect(publisherKey('https://games.example.co.uk/rss')).toBe('example.co.uk')
    expect(publisherKey('https://blog.google')).toBe(publisherKey('https://deepmind.google'))
    const items = Array.from({length:12},(_,i)=>({...article(String(i),'same'),source_id:`feed-${i}`}))
    expect(choose(items).diversity.selectedPublishers).toBe(1)
    expect(choose(items).picks).toHaveLength(10)
  })
  it('fills exactly ten from at least five publishers even when every AI recommendation comes from one', () => {
    const items = Array.from({length:40},(_,i)=>article(String(i),`pub${Math.floor(i/8)}`))
    const proposed = automaticPicks(items.filter(a=>a.publisher_key==='pub0'),[],new Set()).map(p=>({...p,score:100,selection_method:'ai' as const}))
    const result = selectSectorPicks(proposed,items,[],new Set(),[],7)
    expect(result.picks).toHaveLength(10)
    expect(result.diversity.selectedPublishers).toBe(5)
    expect(result.diversity.targetPublishers).toBe(5)
    for (const publisher of new Set(items.map(a=>a.publisher_key))) expect(result.picks.filter(p=>items.find(a=>a.id===p.id)?.publisher_key===publisher).length).toBeLessThanOrEqual(2)
  })
  it('reassigns a shared event so a rare publisher is not excluded by a greedy first pick', () => {
    const items = [article('1','a'),article('2','a'),article('3','b'),article('4','c'),article('5','d'),article('6','rare','Videogioco numero 1: nuova modalità')]
    const result = choose(items)
    expect(result.diversity.selectedPublishers).toBe(5)
    expect(result.picks.map(p=>p.id)).toContain('6')
    expect(result.picks.map(p=>p.id)).not.toContain('1')
  })
  it('does not count five publishers repeating a single event as five distinct choices', () => {
    const items = Array.from({length:5},(_,i)=>article(String(i),`pub${i}`,'OpenAI annuncia il nuovo modello linguistico avanzato'))
    const result = choose(items)
    expect(result.picks).toHaveLength(1)
    expect(result.diversity).toMatchObject({availablePublishers:5,attainablePublishers:1,targetPublishers:1,selectedPublishers:1})
  })
  it('fills sparse sectors with available publishers without inventing diversity', () => {
    const result = choose(Array.from({length:15},(_,i)=>article(String(i),`pub${i%3}`)))
    expect(result.picks).toHaveLength(10)
    expect(result.diversity).toMatchObject({selectedPublishers:3,targetPublishers:3})
  })
  it('excludes promotions, undated/old records, opened stories and negative preferences before counting', () => {
    const items = [article('1','good'),article('2','read'),article('3','ad','Videogioco in offerta con coupon'),{...article('4','old'),published_at:'2020-01-01'}, {...article('5','undated'),published_at:null},article('6','blocked')]
    const feedback = [{article_id:'6',source_id:'blocked-feed',preference:'less_source',title:'x',excerpt:null,source_name:'blocked',updated_at:''}] as Feedback[]
    expect(eligibleSectorArticles(items,new Set(['2']),feedback,7).map(a=>a.id)).toEqual(['1'])
    expect(choose(eligibleSectorArticles(items,new Set(['2']),feedback,7)).diversity.selectedPublishers).toBe(1)
  })
  it('allows read stories only when none remain unread and keeps the read explanation', () => {
    const items = [article('1','a')]
    const reads = new Set(['1'])
    const eligible = eligibleSectorArticles(items,reads,[],7)
    expect(selectSectorPicks([],eligible,[],reads,[],7).picks[0].reason).toContain('già consultato')
  })
  it('returns an empty selection for an empty eligible pool', () => {
    expect(choose([])).toMatchObject({picks:[],diversity:{selectedPublishers:0,targetPublishers:0}})
  })
})

it('deduplicates the observed DGX Spark memory revision without merging different versions',()=>{
  const a=article('1','a','NVIDIA DGX Spark, ecco la versione con soli 64 GB di RAM. Scende il prezzo: 4.999 dollari')
  const b=article('2','b',"NVIDIA DGX Spark da 64 GB: arriva il nuovo modello per l’AI locale a 4.999 dollari")
  expect(sameSectorEvent(a,b)).toBe(true)
  expect(sameSectorEvent(a,{...b,title:'NVIDIA DGX Spark da 128 GB'})).toBe(false)
  expect(choose([a,b]).picks).toHaveLength(1)
})

it('applies topic evidence equally after calibration without demoting model choices automatically',()=>{
  const items=Array.from({length:15},(_,i)=>({...article(String(i),`pub${i%5}`),sector_relevance:12}))
  const model=automaticPicks([items[0]],[],new Set()).map(pick=>({...pick,selection_method:'ai' as const,score:90}))
  const result=selectSectorPicks(model,items,[],new Set(),[],7)
  expect(result.picks[0]).toMatchObject({id:'0',selection_method:'ai'})
  expect(result.diversity.selectedPublishers).toBe(5)
})
