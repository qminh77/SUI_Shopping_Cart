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
        const { reason, currentStatus } = await req.json()

        if (!reason) {
            return NextResponse.json({ error: 'Reason is required for suspension' }, { status: 400 })
        }

        await updateShopStatus(id, 'SUSPENDED', session.wallet, reason, currentStatus)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Suspend shop error:', error)
        return NextResponse.json({ error: 'Failed to suspend shop' }, { status: 500 })
    }
}
