import { describe, it, expect } from 'vitest'
import { classifyArticle } from './catalog'
describe('article-level sectors', () => {
  it('supports overlapping interests for one story', () => {
    expect(classifyArticle({ title: 'OpenAI porta ChatGPT nei videogiochi' })).toEqual(['ia', 'tecnologia', 'videogiochi'])
    expect(classifyArticle({ title: 'Catania: il Tribunale pronuncia la sentenza' })).toEqual(['diritto', 'sicilia-catania'])
  })
  it('reads descriptions but avoids Italian prepositions and substring matches', () => {
    expect(classifyArticle({ title: 'Il Comune risponde ai cittadini' })).not.toContain('ia')
    expect(classifyArticle({ title: 'La lettera di un amico' })).not.toContain('ia')
    expect(classifyArticle({ title: 'The impact of AI on society' })).toContain('ia')
    expect(classifyArticle({ title: 'The impact of AI on society' })).toContain('tecnologia')
    expect(classifyArticle({ title: 'New AI platform for public transport' })).toContain('ia')
    expect(classifyArticle({ title: 'Nuovo studio', excerpt: 'Ricerca sulla sicurezza informatica e malware' })).toContain('tecnologia')
  })
})
