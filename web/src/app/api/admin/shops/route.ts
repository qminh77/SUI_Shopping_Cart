import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-admin'
import { getShops } from '@/services/shop.service'

export async function GET(req: NextRequest) {
    // Check Auth
    const session = await verifyAdminSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status') || undefined
    const query = searchParams.get('q') || undefined

    try {
        const result = await getShops(page, 20, status, query)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Get shops error:', error)
        return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
    }
}
