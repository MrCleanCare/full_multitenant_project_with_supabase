import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/dashboard', '/client']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing login page with a session, redirect to dashboard
  if (session && req.nextUrl.pathname === '/') {
    const redirectUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/client/:path*']
} 