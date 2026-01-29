import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // 1. Check if the route is protected
  const protectedPaths = ['/dashboard', '/api/messages', '/api/users', '/api/config']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtected) {
    const session = request.cookies.get('session')?.value

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // 2. Verify Session
      await decrypt(session)
      return NextResponse.next()
    } catch (error) {
      // Invalid session
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - api/auth (auth endpoints)
     * - api/health (health check)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth|api/health).*)',
  ],
}
