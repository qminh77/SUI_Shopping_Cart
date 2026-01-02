import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
    const nonce = crypto.randomBytes(32).toString('hex')
    // In a real app, store this nonce in DB/Redis with an expiry associated with the wallet or session ID.
    // For this MVP phase, we just return it for the client to sign.
    return NextResponse.json({ nonce })
}
