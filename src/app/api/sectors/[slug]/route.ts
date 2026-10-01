import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOwner, enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { getSector } from '@/lib/sectors/catalog'
import { sectorFeed, latestCuration, curateSector } from '@/lib/sectors/server'
export const maxDuration = 90
const filters = z.object({ q: z.string().trim().max(120).default(''), source: z.string().uuid().optional(), period: z.enum(['all', 'day', 'week', 'month']).default('all'), offset: z.coerce.number().int().min(0).max(100_000).default(0), selection: z.string().uuid().optional() }).strict()
type Context = { params: Promise<{ slug: string }> }
const headers = { 'Cache-Control': 'private, no-store' }
export async function GET(request: Request, context: Context) {
  try {
    const owner = await requireOwner(request)
    const sector = getSector((await context.params).slug)
    if (!sector) return NextResponse.json({ message: 'Settore non trovato' }, { status: 404 })
    const input = filters.parse(Object.fromEntries(new URL(request.url).searchParams))
    const [feed, curation] = await Promise.all([sectorFeed(owner.id, sector, input), latestCuration(owner.id, sector, input.selection)])
    return NextResponse.json({ ...feed, nextOffset: input.offset + feed.articles.length, curation }, { headers })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: 'Filtri non validi' }, { status: 400 })
    return apiError(error, 'Caricamento settore non disponibile')
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const owner = await requireOwner(request)
    const sector = getSector((await context.params).slug)
    if (!sector) return NextResponse.json({ message: 'Settore non trovato' }, { status: 404 })
    enforceRateLimit(`sector:${owner.id}`, 5, 60_000)
    return NextResponse.json({ curation: await curateSector(owner.id, sector) }, { headers })
  } catch (error) { return apiError(error, 'Selezione del settore non disponibile') }
}
