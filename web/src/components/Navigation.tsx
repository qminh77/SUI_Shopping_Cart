'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { WalletConnection } from './WalletConnection';
import { CartDrawer } from './CartDrawer';
import { cn } from '@/lib/utils';
import { ShoppingCart, Menu, X, Shield, LayoutDashboard, User } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function Navigation() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    const [isOpen, setIsOpen] = useState(false);

    const NavItems = [
        { href: '/shop', label: 'Marketplace', icon: ShoppingCart },
        { href: '/seller', label: 'Seller Dashboard', icon: LayoutDashboard },
        { href: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 group no-underline relative z-10">
                    <div className="h-8 w-6 md:h-10 md:w-8 flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
                        {/* Official Sui Droplet Shape */}
                        <svg viewBox="0 0 384 512" className="h-full w-auto drop-shadow-[0_0_10px_rgba(77,162,255,0.4)]">
                            <defs>
                                <linearGradient id="suiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4DA2FF" />
                                    <stop offset="100%" stopColor="#3D5E99" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M192 0C86 0 0 172 0 286.5c0 124.5 86 225.5 192 225.5s192-101 192-225.5C384 172 298 0 192 0z"
                                fill="url(#suiGradient)"
                            />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center h-full">
                        <span className="font-sans font-bold text-lg md:text-xl tracking-tighter leading-none flex items-center gap-1.5 text-white group-hover:text-blue-200 transition-colors">
                            SUI <span className="font-light opacity-80 text-blue-400">COMMERCE</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5 mr-6 backdrop-blur-md">
                        {NavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-5 py-2 rounded-full text-xs uppercase tracking-wider font-bold transition-all duration-300 relative overflow-hidden",
                                    isActive(item.href)
                                        ? "text-white bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                                        : "text-neutral-400 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                        <CartDrawer />
                        <WalletConnection />
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-3">
                    <CartDrawer />

                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-sm w-10 h-10">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-black/95 backdrop-blur-xl p-0">
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b border-white/10">
                                    <SheetTitle className="text-xl font-bold tracking-tighter text-white mb-2">MENU</SheetTitle>
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest">Navigation</p>
                                </div>

                                <div className="flex-1 py-6 px-4 space-y-2">
                                    {NavItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-4 text-sm uppercase tracking-wider font-bold transition-all border-l-2",
                                                    isActive(item.href)
                                                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                                        : "border-transparent text-neutral-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div className="p-6 border-t border-white/10 bg-white/5">
                                    <div className="mb-4">
                                        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Wallet</p>
                                        <div className="flex justify-center">
                                            <WalletConnection />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
