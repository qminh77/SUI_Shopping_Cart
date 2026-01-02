import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-admin'
import { getShops } from '@/services/shop.service'

export async function GET(req: NextRequest) {
    // Check Auth
    console.log('[Admin Shops API] Checking session...')
    const session = await verifyAdminSession()
    console.log('[Admin Shops API] Session result:', session)

    if (!session) {
        console.log('[Admin Shops API] No session found, returning 401')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status') || undefined
    const query = searchParams.get('q') || undefined

    console.log('[Admin Shops API] Fetching shops:', { page, status, query })

    try {
        const result = await getShops(page, 20, status, query)
        console.log('[Admin Shops API] Success, returning', result.count, 'shops')
        return NextResponse.json(result)
    } catch (error) {
        console.error('[Admin Shops API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch shops', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
