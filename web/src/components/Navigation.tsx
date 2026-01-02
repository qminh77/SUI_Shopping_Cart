'use client';

import { Button, Link as GeistLink, Text, Grid } from '@geist-ui/core';
import { WalletConnection } from './WalletConnection';
// We use Next.js Link for client-side routing, but wrap it or use GeistLink depending on need.
// GeistLink works well for external, but for internal we might want to combine.
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { CartDrawer } from './CartDrawer';

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav style={{
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50
        }}>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(77, 162, 255, 0.5), transparent)', width: '100%' }} />
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <NextLink href="/" className="flex items-center gap-3 no-underline text-inherit group">
                    <div style={{
                        height: '40px',
                        width: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'float 6s ease-in-out infinite'
                    }}>
                        {/* Official Sui Droplet Shape */}
                        <svg viewBox="0 0 384 512" style={{ height: '100%', width: 'auto' }}>
                            <defs>
                                <linearGradient id="suiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4DA2FF" />
                                    <stop offset="100%" stopColor="#3D5E99" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M192 0C86 0 0 172 0 286.5c0 124.5 86 225.5 192 225.5s192-101 192-225.5C384 172 298 0 192 0z"
                                fill="url(#suiGradient)"
                                style={{ filter: 'drop-shadow(0 0 10px rgba(77, 162, 255, 0.4))' }}
                            />
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center h-full">
                        <span style={{
                            fontFamily: 'var(--font-geist-sans)',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            letterSpacing: '-0.5px',
                            lineHeight: '1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            SUI <span style={{ fontWeight: 300, opacity: 0.8 }}>COMMERCE</span>
                        </span>
                    </div>
                </NextLink>

                <div className="flex items-center gap-8">
                    {/* @ts-ignore */}
                    <NextLink
                        href="/shop"
                        className={`block transition-colors hover:text-white ${pathname === '/shop' ? 'text-[var(--sui-blue)]' : 'text-[#888]'}`}
                        style={{
                            textTransform: 'uppercase',
                            fontSize: '0.8rem',
                            letterSpacing: '1px',
                            fontWeight: 500,
                            color: pathname === '/shop' ? '#4DA2FF' : '#888'
                        }}
                    >
                        Marketplace
                    </NextLink>
                    {/* @ts-ignore */}
                    <NextLink
                        href="/seller"
                        className={`block transition-colors hover:text-white ${pathname === '/seller' ? 'text-[var(--sui-blue)]' : 'text-[#888]'}`}
                        style={{
                            textTransform: 'uppercase',
                            fontSize: '0.8rem',
                            letterSpacing: '1px',
                            fontWeight: 500,
                            color: pathname === '/seller' ? '#4DA2FF' : '#888'
                        }}
                    >
                        Seller Dashboard
                    </NextLink>

                    <div className="flex items-center gap-4 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        <CartDrawer />
                        <WalletConnection />
                    </div>
                </div>
            </div>
        </nav>
    );
}
