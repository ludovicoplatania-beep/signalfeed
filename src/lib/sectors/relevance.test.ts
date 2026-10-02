import { describe, expect, it } from 'vitest'
import { sectorRelevance } from './relevance'
import { getSector } from './catalog'
describe('thematic subject evidence',()=>{
  it('does not classify a medical console as gaming',()=>{
    expect(sectorRelevance({title:'Maestro, il robot chirurgico al letto operatorio',excerpt:'Il medico usa una console innovativa.'},getSector('videogiochi')!)).toBe(0)
    expect(sectorRelevance({title:'Nintendo presenta una nuova console'},getSector('videogiochi')!)).toBeGreaterThan(0)
  })
  it('does not classify legal words in a TV plot or consultation headline as legal coverage',()=>{
    expect(sectorRelevance({title:'La nuova serie Netflix con Florence Pugh',excerpt:'Una storia in tribunale tra sentenze e amori.'},getSector('diritto')!)).toBe(0)
    expect(sectorRelevance({title:'Sony consultation on physical media',excerpt:'Gamers have a right to access their discs.'},getSector('diritto')!)).toBe(0)
  })
  it('prioritizes substantial judicial and criminal coverage over incidental celebrity judgments',()=>{
    const sector=getSector('diritto')!
    expect(sectorRelevance({title:'Processo per bancarotta: tribunale assolve gli imputati'},sector)).toBeGreaterThan(sectorRelevance({title:'Valentina dovrà pagare al suo ex: la sentenza'},sector))
    expect(sectorRelevance({title:'Cassazione, art. 73 e processo penale'},sector)).toBeGreaterThan(0)
  })
  it('requires technological subject evidence instead of incidental mention in a motorcycle article',()=>{
    expect(sectorRelevance({title:'BMW F 450 R, la naked da 48 CV',excerpt:'Questa moto offre un computer di bordo.'},getSector('tecnologia')!)).toBe(0)
    expect(sectorRelevance({title:'Microsoft, hackerato account per truffa crypto'},getSector('tecnologia')!)).toBeGreaterThan(0)
  })
  it('does not promote an Amazon preorder as gaming news',()=>{
    expect(sectorRelevance({title:'Amazon: preorder per God of War su PlayStation 5'},getSector('videogiochi')!)).toBe(0)
    expect(sectorRelevance({title:'God of War, annunciata la data di uscita su PlayStation 5'},getSector('videogiochi')!)).toBeGreaterThan(0)
  })
})

it('does not confuse Cyberpunk trading cards with cybersecurity',()=>{
  expect(sectorRelevance({title:'Cyberpunk e Palworld: carte da gioco a Lucca'},getSector('tecnologia')!)).toBe(0)
})

it('reads capitalized AI introductions without confusing Italian prepositions',()=>{
  expect(sectorRelevance({title:'Un nuovo strumento per analizzare dati',excerpt:'Intelligenza artificiale: OpenAI presenta il modello.'},getSector('ia')!)).toBeGreaterThan(0)
  expect(sectorRelevance({title:'Comune risponde ai cittadini',excerpt:'Le risposte ai residenti sono online.'},getSector('ia')!)).toBe(0)
})


it('requires a local subject rather than a reality show contestant or a distant excerpt mention',()=>{
  const sector=getSector('sicilia-catania')!
  expect(sectorRelevance({title:'Grande Fratello Vip: Megan mostra il bigliettino',excerpt:'Il concorrente di Palermo reagisce.'},sector)).toBe(0)
  expect(sectorRelevance({title:'Un caso di cronaca nazionale',excerpt:'Un racconto nazionale. '.repeat(20)+' Palermo.'},sector)).toBe(0)
  expect(sectorRelevance({title:'Mostra di scultura a Catania',excerpt:'Arte in piazza.'},sector)).toBe(12)
  expect(sectorRelevance({title:'Incendio in una palazzina',excerpt:'A Catania sono intervenuti i pompieri.'},sector)).toBeGreaterThan(0)
})
