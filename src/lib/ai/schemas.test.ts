import { describe, expect, it } from 'vitest'
import { pickResponseSchema, topicsResponseSchema } from './schemas'

describe('AI response schemas', () => {
  it('rejects out-of-range scores and unknown article identifiers', () => {
    expect(pickResponseSchema.safeParse({
      picks: [{
        id: 'not-a-uuid',
        score: 101,
        summary: 'test',
        reason: 'test',
        category: 'test',
      }],
    }).success).toBe(false)
  })

  it('caps the number of generated topics', () => {
    const topic = {
      title: 'Topic',
      description: 'Description',
      score: 50,
      articles: ['00000000-0000-4000-8000-000000000001'],
    }
    expect(topicsResponseSchema.safeParse(Array.from({ length: 9 }, () => topic)).success).toBe(false)
  })
})
