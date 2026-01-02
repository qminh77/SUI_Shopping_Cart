import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-admin'
import { getShopById } from '@/services/shop.service'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await verifyAdminSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
        const data = await getShopById(id)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Get shop detail error:', error)
        return NextResponse.json({ error: 'Failed to fetch shop details' }, { status: 500 })
    }
}
