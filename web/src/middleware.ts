import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 1. Admin Route Protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Exclude login page to prevent infinite loop
        if (request.nextUrl.pathname === '/admin/login') {
            return NextResponse.next()
        }

        // Check for admin session cookie
        const adminSession = request.cookies.get('admin_session')

        if (!adminSession) {
            // Redirect to login if no session
            const loginUrl = new URL('/admin/login', request.url)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Match all paths starting with /admin
        '/admin/:path*',
    ],
}
