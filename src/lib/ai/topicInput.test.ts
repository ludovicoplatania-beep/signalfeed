import { describe, expect, it } from 'vitest'
import { topicInput, topicReferences, topicFormat } from './topicInput'
import type { Candidate } from './ranking'
const articles = [{id:'existing-a',title:'OpenAI presenta un modello',excerpt:'x'.repeat(500)}, {id:'existing-b',title:'Nuovo modello OpenAI',excerpt:null}] as Candidate[]
describe('bounded thematic references', () => {
  it('uses compact references rather than asking the model to reproduce identifiers', () => {
    expect(topicInput(articles)[0]).toMatchObject({ref:1,excerpt:'x'.repeat(160)})
    expect(topicInput(articles)[0]).not.toHaveProperty('id')
    expect(topicFormat(2).json_schema.schema.properties.topics.items.properties.articles.items.enum).toEqual([1,2])
  })
  it('maps only existing integer references and removes repeated references', () => {
    expect(topicReferences([1,2,1,0,3,1.5,'1',null], articles)).toEqual(['existing-a','existing-b'])
    expect(topicReferences('existing-a',articles)).toEqual([])
  })
})
