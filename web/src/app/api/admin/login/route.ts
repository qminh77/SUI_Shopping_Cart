import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, getAdminWallets, verifyAdminSignature } from '@/lib/auth-admin'

export async function POST(req: NextRequest) {
    try {
        const { wallet, signature, publicKey, nonce } = await req.json()

        if (!wallet || !signature || !publicKey) {
            return NextResponse.json({ error: 'Missing wallet, signature, or publicKey' }, { status: 400 })
        }

        // 1. Verify Signature
        const isValid = await verifyAdminSignature(wallet, signature, publicKey, nonce)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // 2. Check Admin Whitelist
        const adminWallets = await getAdminWallets()
        if (!adminWallets.includes(wallet.toLowerCase())) {
            return NextResponse.json({ error: 'Not authorized as admin' }, { status: 403 })
        }

        // 3. Create Session
        await createAdminSession(wallet)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
