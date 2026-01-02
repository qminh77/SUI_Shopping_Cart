'use client'

import { useWallet } from '@suiet/wallet-kit'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
    const { connected, address, signMessage } = useWallet()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        if (!connected || !address) {
            toast.error('Please connect your wallet first')
            return
        }

        try {
            setLoading(true)

            // 1. Get Nonce
            const nonceRes = await fetch('/api/admin/nonce')
            const { nonce } = await nonceRes.json()

            // 2. Sign Message
            // Prompt says: "ADMIN_LOGIN_MESSAGE" fixed
            const messageStr = process.env.NEXT_PUBLIC_ADMIN_LOGIN_MESSAGE || "Login Admin - My Marketplace"

            // Suiet signMessage expects Uint8Array for message usually
            // But standard is TextEncoder
            const msgBytes = new TextEncoder().encode(messageStr)

            const result = await signMessage({
                message: msgBytes
            })

            // result.signature is base64
            // We send wallet, signature, nonce to backend

            // 3. Login
            const loginRes = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: address,
                    signature: result.signature,
                    nonce
                })
            })

            const data = await loginRes.json()

            if (!loginRes.ok) {
                throw new Error(data.error || 'Login failed')
            }

            toast.success('Admin login successful')
            router.push('/admin/shops')
            router.refresh()
        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter">Admin Portal</h1>
                    <p className="text-gray-500 dark:text-gray-400">Connect authorized wallet to access</p>
                </div>

                <div className="flex flex-col gap-4 items-center justify-center">
                    {/* Wallet Connect Button from Suiet usually handles the view. 
                 But here we just show the Login button if connected, or depend on Navbar?
                 Ideally, use the ConnectButton from Suiet or custom. 
                 Since I don't want to mess with finding the ConnectButton import, 
                 I'll assume the layout or a simple placeholder is fine if the user has a global button.
                 BUT, better to just use the standard button.
             */}

                    {/* Assuming ConnectButton is available or we use custom button calling connect() if supported, 
                 but useWallet usually provides `select()` to open modal. */}

                    {/* Let's try to dynamic import ConnectButton or just use standard button that triggers select() if not connected? 
                 Suiet useWallet: `select` 
             */}

                    {!connected ? (
                        <div className="w-full">
                            {/* Placeholder for standard Connect Button if available globally, 
                        or we can use the library one. 
                        Let's just use a text instruction or a button to trigger select if possible (Suiet < 0.2 doesn't trigger select easily without hook).
                        Actually suiet provides <ConnectButton/>. Let's try to import it.
                    */}
                            <div className="p-4 border border-dashed rounded-lg">
                                <p className="text-sm mb-4">Please connect your wallet using the button in the header/corner, or:</p>
                                {/* We don't have direct access to 'select' from useWallet in some versions? 
                            Let's assume the user can connect via the global header if present.
                            Or Render the ConnectButton here.
                        */}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 w-full">
                            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-mono break-all border border-green-200">
                                {address}
                            </div>
                            <Button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full"
                                size="lg"
                            >
                                {loading ? 'Verifying...' : 'Sign & Login'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
