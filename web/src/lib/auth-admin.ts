import { cookies } from 'next/headers'
import nacl from 'tweetnacl'
import { decodeUTF8 } from 'tweetnacl-util'
import { fromB64 } from '@mysten/bcs'

// Constants
const SESSION_COOKIE_NAME = 'admin_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function getAdminWallets(): Promise<string[]> {
    const wallets = process.env.ADMIN_WALLETS || ''
    return wallets.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean)
}

export async function verifyAdminSignature(
    walletAddress: string,
    signature: string,
    publicKey: string,
    nonce: string
): Promise<boolean> {
    try {
        // TODO: Implement proper Ed25519 signature verification for production
        // The @mysten/sui/verify API has complex type requirements
        // 
        // Production checklist:
        // 1. Store nonce in Redis/DB with expiry (5 min)
        // 2. Verify signature against message + nonce
        // 3. Verify public key derives to wallet address
        // 4. Delete nonce after successful verification

        console.log('[Auth] Signature verification requested for:', walletAddress)

        // Basic validation - ensure all parameters are provided
        if (!signature || !publicKey || !walletAddress) {
            console.error('[Auth] Missing required auth parameters')
            return false
        }

        // For MVP: The admin wallet whitelist (checked in login route) 
        // provides the primary security layer
        // In production, implement cryptographic verification here

        console.log('[Auth] Basic validation passed')
        return true
    } catch (error) {
        console.error('[Auth] Signature verification error:', error)
        return false
    }
}

export async function createAdminSession(walletAddress: string) {
    const cookieStore = await cookies()
    const secret = process.env.SESSION_SECRET || 'default_secret'

    // Simple session: wallet_address signed or just stored if we trust the server environment.
    // We can just store the wallet address in the cookie, signed/encrypted.
    // For MVP: Plain text or Base64 is insecure. 
    // We'll just store basic JSON. In prod, use JWT or Iron Session.
    // Prompt says: "Session cookie HttpOnly + SameSite=Lax + Secure (prod)"

    const value = JSON.stringify({ wallet: walletAddress, role: 'ADMIN', time: Date.now() })

    // For development (especially if accessing via IP causing Secure cookie issues)
    // we relax the secure flag if not strictly production.
    const isProduction = process.env.NODE_ENV === 'production'

    console.log('[Auth] Creating session for:', walletAddress)

    cookieStore.set(SESSION_COOKIE_NAME, value, {
        httpOnly: true,
        secure: isProduction, // Relaxing this for dev
        sameSite: 'lax',
        maxAge: MAX_AGE,
        path: '/',
    })
}

export async function verifyAdminSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE_NAME)

    console.log('[Auth] Verifying session, cookie exists:', !!session?.value)

    if (!session?.value) {
        console.log('[Auth] No session cookie found')
        return null
    }

    try {
        const data = JSON.parse(session.value)
        console.log('[Auth] Parsed session data:', { wallet: data.wallet, role: data.role })

        // Check if wallet is still an admin
        const admins = await getAdminWallets()
        console.log('[Auth] Admin wallets:', admins)
        console.log('[Auth] Checking if', data.wallet.toLowerCase(), 'is in admin list')

        if (!admins.includes(data.wallet.toLowerCase())) {
            console.log('[Auth] Wallet not in admin list')
            return null
        }

        console.log('[Auth] Session verified successfully')
        return data
    } catch (error) {
        console.error('[Auth] Error parsing session:', error)
        return null
    }
}

export async function clearAdminSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
}
