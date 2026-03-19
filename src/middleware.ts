import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(function middleware(req) {
  const { nextUrl, auth: session } = req as NextRequest & { auth: ReturnType<typeof auth> extends Promise<infer T> ? T : never }

  const isLoggedIn = !!session
  const isAuthPage = nextUrl.pathname.startsWith('/login')
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isClientRoute = nextUrl.pathname.startsWith('/client')

  if (isApiAuth) return NextResponse.next()

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && isAuthPage) {
    const role = (session as { user?: { role?: string } })?.user?.role
    return NextResponse.redirect(new URL(role === 'CLIENT' ? '/client' : '/admin', nextUrl))
  }

  if (isAdminRoute) {
    const role = (session as { user?: { role?: string } })?.user?.role
    if (role === 'CLIENT') {
      return NextResponse.redirect(new URL('/client', nextUrl))
    }
  }

  if (isClientRoute) {
    const role = (session as { user?: { role?: string } })?.user?.role
    if (role && role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/admin', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
