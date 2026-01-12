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
        // Return 200 with null body if shop doesn't exist, not an error
        return NextResponse.json(shop, { status: 200 })
    } catch (error: any) {
        // Only return 500 for actual errors, not "not found"
        console.error('Get my shop error:', error)
        // Check if it's a "not found" error from Supabase
        if (error.code === 'PGRST116') {
            return NextResponse.json(null, { status: 200 })
        }
        return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { wallet, ...data } = await req.json()

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
        }

        // ✨ NEW: Validate on_chain_shop_id if being updated
        if ('on_chain_shop_id' in data) {
            // If trying to set on_chain_shop_id, validate format
            if (data.on_chain_shop_id) {
                if (!data.on_chain_shop_id.startsWith('0x') || data.on_chain_shop_id.length !== 66) {
                    return NextResponse.json(
                        { error: 'Invalid on_chain_shop_id format. Must be a 66-character hex string starting with 0x' },
                        { status: 400 }
                    )
                }
                console.log('[API /shops/me PATCH] Updating on_chain_shop_id to:', data.on_chain_shop_id)
            } else {
                console.log('[API /shops/me PATCH] on_chain_shop_id update attempted with null/empty value - will be protected by service layer')
            }
        }

        const updated = await updateShop(wallet, data)
        return NextResponse.json(updated)
    } catch (error) {
        console.error('Update my shop error:', error)
        const message = error instanceof Error ? error.message : 'Failed to update shop'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
