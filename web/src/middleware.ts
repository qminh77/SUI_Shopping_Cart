import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 1. Admin Route Protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Exclude logic page
        if (request.nextUrl.pathname === '/admin/login') {
            return NextResponse.next()
        }

        // Check for admin session cookie
        const adminSession = request.cookies.get('admin_session')

        // Debug log
        console.log(`[Middleware] Checking admin access for ${request.nextUrl.pathname}. Session exists: ${!!adminSession?.value}`)

        if (!adminSession?.value) {
            console.log('[Middleware] Unauthorized. Redirecting to login.')
            // Redirect to login if no session
            const loginUrl = new URL('/admin/login', request.url)
            // Add callback URL to redirect back after login
            loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)

            const response = NextResponse.redirect(loginUrl)

            // Prevent caching of the redirect
            response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            response.headers.set('Pragma', 'no-cache')
            response.headers.set('Expires', '0')

            return response
        }
    }

    const response = NextResponse.next()

    // If we are in admin, ensure we don't cache the protected pages heavily so logout works immediately
    if (request.nextUrl.pathname.startsWith('/admin')) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    }

    return response
}

export const config = {
    matcher: [
        // Match all paths starting with /admin
        '/admin/:path*',
    ],
}
