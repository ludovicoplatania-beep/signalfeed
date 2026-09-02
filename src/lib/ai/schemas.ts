import { z } from 'zod'

export const pickResponseSchema = z.object({
  picks: z.array(z.object({
    id: z.string().uuid(),
    score: z.number().min(1).max(100),
    summary: z.string().max(220),
    reason: z.string().max(180),
    category: z.string().min(1).max(80),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  })).max(10),
})

export const topicsResponseSchema = z.array(z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(220),
  score: z.number().min(1).max(100),
  articles: z.array(z.string().uuid()).min(1).max(20),
  angle: z.string().max(160).optional(),
})).max(8)

export const digestResponseSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().max(900),
  key_points: z.array(z.string().max(240)).max(5),
  recommended_articles: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().max(500),
    reason: z.string().max(240),
  })).max(6),
})

export const interestsResponseSchema = z.object({
  interests: z.array(z.object({
    topic: z.string().min(1).max(100),
    score: z.number().min(1).max(100),
  })).max(15),
})
