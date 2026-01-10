'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Store, Shield, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatrixText } from '@/components/ui/matrix-text';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { CartDrawer } from '@/components/CartDrawer';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { formatAddress } from '@/lib/sui-utils';
import { useState } from 'react';

export function Navigation() {
    const pathname = usePathname();
    const account = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => pathname?.startsWith(path);

    const navLinks = [
        { href: '/shop', label: 'Shop', show: true },
        { href: '/profile/orders', label: 'My Orders', show: !!account },
        { href: '/seller', label: 'Seller Hub', icon: Store, show: !!account },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                {/* Logo */}
                <Link href="/shop" className="flex items-center gap-3 group">
                    <div className="relative h-8 w-20 transition-opacity duration-200 group-hover:opacity-80">
                        <Image
                            src="/logo.svg"
                            alt="Sui"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="hidden sm:inline-block border-l border-border pl-3">
                        <MatrixText text="SHOP" className="text-lg font-bold tracking-tight text-muted-foreground" hover={true} />
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-4">
                    {navLinks.map((link) => link.show && (
                        <Button
                            key={link.href}
                            variant={isActive(link.href) ? 'secondary' : 'ghost'}
                            size="sm"
                            asChild
                        >
                            <Link href={link.href} className="flex items-center font-medium group">
                                {link.icon && <link.icon className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />}
                                <MatrixText text={link.label} className={isActive(link.href) ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"} />
                            </Link>
                        </Button>
                    ))}
                </nav>

                {/* Right Section */}
                <div className="flex items-center space-x-4">
                    {/* Cart */}
                    <CartDrawer />

                    {/* Mobile Menu */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                            <SheetHeader>
                                <SheetTitle><MatrixText text="MENU" speed={50} /></SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 flex flex-col space-y-3">
                                {account && (
                                    <div className="pb-4 mb-4 border-b border-border">
                                        <p className="text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider">Connected Wallet</p>
                                        <p className="text-xs text-foreground font-mono truncate">
                                            {formatAddress(account.address)}
                                        </p>
                                    </div>
                                )}

                                {navLinks.map((link) => link.show && (
                                    <Button
                                        key={link.href}
                                        variant={isActive(link.href) ? 'secondary' : 'ghost'}
                                        asChild
                                        className="justify-start"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Link href={link.href}>
                                            {link.icon && <link.icon className="h-4 w-4 mr-2" />}
                                            <MatrixText text={link.label} />
                                        </Link>
                                    </Button>
                                ))}

                                {account && (
                                    <>
                                        <div className="pt-4 mt-4 border-t border-border space-y-3">
                                            <Button
                                                variant="ghost"
                                                asChild
                                                className="justify-start w-full"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <Link href="/profile/addresses">
                                                    <User className="h-4 w-4 mr-2" />
                                                    <MatrixText text="MY ADDRESSES" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                asChild
                                                className="justify-start w-full"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <Link href="/receipts">
                                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                                    <MatrixText text="RECEIPTS" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                asChild
                                                className="justify-start w-full"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <Link href="/admin">
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    <MatrixText text="ADMIN PANEL" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="justify-start w-full text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => {
                                                    disconnect();
                                                    setMobileMenuOpen(false);
                                                }}
                                            >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                <MatrixText text="LOG OUT" />
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {!account && (
                                    <div className="pt-4 mt-4 border-t border-border">
                                        <WalletConnectButton />
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Desktop User Menu */}
                    {account ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="hidden md:flex">
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border/50 hover:border-foreground/50 transition-colors">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-muted text-foreground font-mono border border-input text-xs">
                                            {formatAddress(account.address).slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">My Account</p>
                                        <p className="text-xs leading-none text-muted-foreground font-mono">
                                            {formatAddress(account.address)}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile/orders" className="cursor-pointer group">
                                        <User className="mr-2 h-4 w-4" />
                                        <MatrixText text="My Orders" speed={15} />
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/profile/addresses" className="cursor-pointer group">
                                        <User className="mr-2 h-4 w-4" />
                                        <MatrixText text="My Addresses" speed={15} />
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/seller" className="cursor-pointer group">
                                        <Store className="mr-2 h-4 w-4" />
                                        <MatrixText text="Seller Dashboard" speed={15} />
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/receipts" className="cursor-pointer group">
                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                        <MatrixText text="Receipts" speed={15} />
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/admin" className="cursor-pointer group">
                                        <Shield className="mr-2 h-4 w-4" />
                                        <MatrixText text="Admin Panel" speed={15} />
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                    onClick={() => disconnect()}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <MatrixText text="Log Out" speed={15} />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <WalletConnectButton className="hidden md:flex" />
                    )}
                </div>
            </div>
        </header>
    );
}
