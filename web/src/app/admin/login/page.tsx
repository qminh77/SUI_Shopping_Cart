'use client'

import { WalletConnectButton } from '@/components/WalletConnectButton'
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Loader2 } from 'lucide-react'
import Image from 'next/image'

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

            const nonceRes = await fetch('/api/admin/nonce')
            const { nonce } = await nonceRes.json()

            const messageStr = process.env.NEXT_PUBLIC_ADMIN_LOGIN_MESSAGE || "Login Admin - My Marketplace"
            const msgBytes = new TextEncoder().encode(messageStr)

            const result = await signPersonalMessage({
                message: msgBytes
            })

            const loginRes = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: account.address,
                    signature: result.signature,
                    publicKey: account.publicKey,
                    nonce
                })
            })

            const data = await loginRes.json()

            if (!loginRes.ok) {
                throw new Error(data.error || 'Login failed')
            }

            toast.success('Admin login successful')
            window.location.href = '/admin/shops'
        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    if (!isMounted) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <div className="relative h-12 w-32">
                            <Image
                                src="/logo.svg"
                                alt="Admin Portal"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold uppercase tracking-wider">
                            Admin Portal
                        </CardTitle>
                        <CardDescription>
                            Restricted access - Authentication required
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {!account ? (
                        <div className="flex flex-col items-center gap-6 py-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Connect your Web3 wallet to authenticate
                            </p>
                            <WalletConnectButton />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Connected Wallet
                                </p>
                                <div className="p-4 bg-muted/50 border border-border flex items-center justify-between">
                                    <code className="text-sm text-foreground truncate pr-4 font-mono">
                                        {account.address}
                                    </code>
                                    <Badge variant="outline" className="shrink-0 bg-background">
                                        Active
                                    </Badge>
                                </div>
                            </div>

                            <Button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full h-11 uppercase font-bold tracking-wider"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Sign In as Admin
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    <div className="pt-4 border-t border-border flex justify-between text-xs text-muted-foreground font-mono">
                        <span>System v2.0.4</span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Secure
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AdminLoginPage() {
    return <LoginForm />
}
