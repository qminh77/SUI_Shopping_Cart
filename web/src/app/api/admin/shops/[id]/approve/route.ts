import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-admin'
import { updateShopStatus } from '@/services/shop.service'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await verifyAdminSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
        const { note, currentStatus } = await req.json()
        // Approve means setting to ACTIVE
        await updateShopStatus(id, 'ACTIVE', session.wallet, note, currentStatus)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Approve shop error:', error)
        return NextResponse.json({ error: 'Failed to approve shop' }, { status: 500 })
    }
}
