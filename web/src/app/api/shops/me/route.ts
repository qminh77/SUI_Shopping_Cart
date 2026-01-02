import { NextRequest, NextResponse } from 'next/server'
import { getShopByWallet, updateShop } from '@/services/shop.service'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
        return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    try {
        const shop = await getShopByWallet(wallet)
        return NextResponse.json(shop || null) // Return null if 404/not found logic
    } catch (error) {
        console.error('Get my shop error:', error)
        return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { wallet, ...data } = await req.json()

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
        }

        const updated = await updateShop(wallet, data)
        return NextResponse.json(updated)
    } catch (error) {
        console.error('Update my shop error:', error)
        return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
    }
}
