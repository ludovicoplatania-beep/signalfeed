import { NextResponse, type NextRequest } from 'next/server'
import { ACCESS_COOKIE, verifyAccessToken } from '@/lib/auth/session'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (
    pathname === '/access' ||
    pathname === '/api/access/login' ||
    pathname.startsWith('/api/cron/')
  ) {
    return NextResponse.next()
  }

  const authenticated = await verifyAccessToken(
    request.cookies.get(ACCESS_COOKIE)?.value,
    process.env.APP_SESSION_SECRET,
  )
  if (authenticated) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, message: 'Accesso richiesto' }, { status: 401 })
  }

  const loginUrl = new URL('/access', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|brand/).*)',
  ],
}
