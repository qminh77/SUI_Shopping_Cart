'use client'

import { WalletConnectButton } from '@/components/WalletConnectButton'
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Loader2 } from 'lucide-react'

function LoginForm() {
    const account = useCurrentAccount()
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage()

    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleLogin = async () => {
        if (!account) {
            toast.error('Please connect your wallet first')
            return
        }

        try {
            setLoading(true)

            // 1. Get Nonce
            const nonceRes = await fetch('/api/admin/nonce')
            const { nonce } = await nonceRes.json()

            // 2. Sign Message
            const messageStr = process.env.NEXT_PUBLIC_ADMIN_LOGIN_MESSAGE || "Login Admin - My Marketplace"
            const msgBytes = new TextEncoder().encode(messageStr)

            const result = await signPersonalMessage({
                message: msgBytes
            })

            // 3. Login
            const loginRes = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: account.address,
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
            window.location.href = '/admin/shops'
        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    if (!isMounted) return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white p-10">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <div className="text-xl font-bold animate-pulse text-blue-400 font-mono tracking-widest">INITIALIZING SECURE LINK...</div>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black relative overflow-hidden text-white font-sans selection:bg-blue-500/30">

            {/* Background Glow matching landing page */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(77,162,255,0.15)_0%,transparent_70%)] blur-[60px] z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none z-0" />

            <div className="w-full max-w-md p-1 relative z-10">
                {/* Tech Border Wrapper */}
                <div className="cut-corner p-[1px] bg-gradient-to-b from-blue-500/20 to-transparent">
                    <div className="bg-black/80 backdrop-blur-xl p-8 cut-corner border border-blue-500/10 shadow-2xl relative">

                        {/* Header */}
                        <div className="text-center space-y-4 mb-8">
                            <div className="flex justify-center mb-6 relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-50"></div>
                                <div className="h-16 w-16 bg-blue-900/10 flex items-center justify-center border border-blue-500/30 relative z-10 tech-border-glow cut-corner">
                                    <ShieldCheck className="h-8 w-8 text-blue-400" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                                    ADMIN <span className="text-blue-500">PORTAL</span>
                                </h1>
                                <p className="text-blue-400/60 text-xs font-mono tracking-[0.2em] uppercase">Restricted Access // Level 5</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-6">
                            {!account ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-6">
                                    <div className="text-center space-y-2">
                                        <p className="text-sm text-neutral-400">Connect Web3 ID to authenticate.</p>
                                    </div>
                                    <div className="w-full flex justify-center">
                                        <WalletConnectButton />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest pl-1">Identity Verified</div>
                                        <div className="p-4 bg-blue-500/5 border border-blue-500/20 flex items-center justify-between group hover:bg-blue-500/10 transition-colors cut-corner-bottom-right">
                                            <div className="font-mono text-sm text-blue-400 truncate pr-4">
                                                {account.address}
                                            </div>
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[9px] px-1.5 rounded-none">
                                                ONLINE
                                            </Badge>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleLogin}
                                        disabled={loading}
                                        className="w-full h-12 text-sm font-bold bg-white text-black hover:bg-blue-500 hover:text-white transition-all duration-300 border-none shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(77,162,255,0.4)] cut-corner-bottom-right uppercase tracking-widest"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                AUTHENTICATING
                                            </>
                                        ) : (
                                            'Initialize Session'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Footer decorative bits */}
                        <div className="mt-8 flex justify-between items-center text-[10px] text-neutral-600 font-mono">
                            <span>SYS.VER.2.0.4</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> SECURE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AdminLoginPage() {
    return <LoginForm />
}
