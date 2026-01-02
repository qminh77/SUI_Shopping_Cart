'use client'

import { useCurrentAccount, useConnectWallet, useWallets, useDisconnectWallet, useAutoConnectWallet } from '@mysten/dapp-kit'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Wallet, LogOut, ChevronDown, Check, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export function WalletConnectButton() {
    const account = useCurrentAccount()
    const { mutate: connect } = useConnectWallet()
    const { mutate: disconnect } = useDisconnectWallet()
    const wallets = useWallets()
    const [isOpen, setIsOpen] = useState(false)

    // Safety check for hydration
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return <Button variant="outline" size="sm" disabled>Loading...</Button>

    if (account) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="font-mono gap-2 text-xs h-9 tech-border-glow">
                        <Wallet className="h-3.5 w-3.5 text-primary" />
                        {account.address.slice(0, 4)}...{account.address.slice(-4)}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-md border-primary/20">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Connected Wallet</DropdownMenuLabel>
                    <div className="px-2 py-1.5 text-xs font-mono break-all bg-secondary/50 rounded-sm mb-2 mx-1">
                        {account.address}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                        onClick={() => disconnect()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-md border-primary/20 p-2">
                <DropdownMenuLabel className="mb-2 px-2 text-xs font-normal text-muted-foreground">
                    Select a wallet to connect
                </DropdownMenuLabel>
                {wallets.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                        No wallets installed. <br />
                        <a href="https://suiet.app/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Get Suiet</a> or <a href="https://sui.io/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Sui Wallet</a>
                    </div>
                ) : (
                    <div className="grid gap-1">
                        {wallets.map((wallet) => (
                            <Button
                                key={wallet.name}
                                variant="ghost"
                                className="w-full justify-start gap-2 h-10 px-2 font-normal hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={() => {
                                    connect(
                                        { wallet },
                                        {
                                            onSuccess: () => setIsOpen(false),
                                        }
                                    )
                                }}
                            >
                                <img src={wallet.icon} alt={wallet.name} className="h-5 w-5 object-contain" />
                                <span className="flex-1 text-left">{wallet.name}</span>
                            </Button>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
