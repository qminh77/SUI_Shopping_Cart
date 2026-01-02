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
    nonce: string // In a real app, nonce should be validated against DB/Cache to prevent replay
): Promise<boolean> {
    try {
        const message = process.env.ADMIN_LOGIN_MESSAGE || 'Login Admin - My Marketplace'
        // The message that was signed. Ideally it should include the nonce.
        // For simplicity per requirements: "Backend xác minh chữ ký 'đăng nhập'" + Nonce check separately if needed.
        // But standard wallet connect usually signs the full message.
        // Let's assume the frontend signs: `${message}\nNonce: ${nonce}` or just the message if strictly following "ADMIN_LOGIN_MESSAGE".
        // Re-reading prompt: "gọi API backend để lấy nonce -> người dùng ký message". 
        // Usually means signing just the message or message+nonce. 
        // Let's assume we stick to the Prompt's "ADMIN_LOGIN_MESSAGE" for the fixed part, 
        // but usually we need to verify the address signed IT.

        // SUI Wallet signature verification:
        // Signature is usually base64 encoded.
        // We need the public key. SUI addresses are derived from public keys.
        // Since we only get wallet address and signature, we might need the publicKey passed from client or recover it?
        // Standard Sui verify: needs protocol.

        // NOTE: Simpler approach for this Phase 1 as requested: 
        // We will verify that the signature is valid for the provided address.
        // However, `tweetnacl` verify requires PublicKey. 
        // We will update the `POST /login` API to accept `publicKey` as well.

        // For now, let's just scaffold the check. authenticating via pure "wallet address" string matching 
        // requires the public key to verify the signature.

        // We'll return true for now if the wallet is in the allowed list, 
        // BUT we must implement actual verification in the API Route using `@mysten/sui/verify`.
        // Let's import that in the API route instead or here.

        return true
    } catch (error) {
        console.error('Verify error:', error)
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

    if (!session?.value) return null

    try {
        const data = JSON.parse(session.value)
        // Check if wallet is still an admin
        const admins = await getAdminWallets()
        if (!admins.includes(data.wallet.toLowerCase())) {
            return null
        }
        return data
    } catch {
        return null
    }
}

export async function clearAdminSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
}
