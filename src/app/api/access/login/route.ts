import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ACCESS_COOKIE, createAccessToken } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/server/auth'
import { getServerEnv } from '@/lib/server/env'

const loginSchema = z.object({ password: z.string().min(1).max(200) }).strict()

export async function POST(request: Request) {
  try {
    const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    enforceRateLimit(`login:${address}`, 5, 15 * 60 * 1000)
    const { password } = loginSchema.parse(await request.json())
    const expected = getServerEnv().APP_PASSWORD
    const suppliedBuffer = Buffer.from(password)
    const expectedBuffer = Buffer.from(expected)
    const valid = suppliedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)

    if (!valid) {
      return NextResponse.json({ success: false, message: 'Password non valida' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(ACCESS_COOKIE, await createAccessToken(getServerEnv().APP_SESSION_SECRET), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Richiesta non valida' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Accesso temporaneamente non disponibile' }, { status: 429 })
  }
}
