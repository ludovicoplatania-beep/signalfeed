import { NextResponse } from 'next/server'
import { RateLimitError, UnauthorizedError } from './auth'

export function apiError(error: unknown, fallback: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 })
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 429 })
  }

  console.error(fallback, error)
  return NextResponse.json({ success: false, message: fallback }, { status: 500 })
}
