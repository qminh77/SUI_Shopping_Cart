'use client'

import { ConnectButton, useWallet } from '@suiet/wallet-kit'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function LoginForm() {
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

            // Force a hard refresh to ensure middleware picks up the cookie
            // changing the window location is often more reliable than router.push for Auth state changes
            window.location.href = '/admin/shops'
        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    // ... (rest of the handleLogin function remains same)

    // Add effect to prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    console.log('AdminLogin: Render. IsMounted:', isMounted)

    if (!isMounted) return <div className="p-10 text-center">Loading Admin Portal...</div>

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter">Admin Portal</h1>
                    <p className="text-gray-500 dark:text-gray-400">Connect authorized wallet to access</p>
                </div>

                <div className="flex flex-col gap-4 items-center justify-center">
                    {!connected ? (
                        <div className="w-full flex flex-col items-center gap-4">
                            <div className="p-4 border border-dashed rounded-lg w-full">
                                <p className="text-sm mb-4">Click below to connect wallet:</p>
                                <div className="flex justify-center">
                                    <ConnectButton />
                                </div>
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

export default function AdminLoginPage() {
    return <LoginForm />
}
