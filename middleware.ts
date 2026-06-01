import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge } from '@/lib/simple-auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const user = await verifyTokenEdge(token)
    if (!user || !user.isAdmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
