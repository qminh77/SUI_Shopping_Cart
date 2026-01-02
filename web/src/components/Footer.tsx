'use client';

import { Text, Grid, Divider } from '@geist-ui/core';

export function Footer() {
    return (
        <footer className="mt-24 pb-12">
            <Divider />
            <div className="max-w-7xl mx-auto px-6 pt-8">
                <Grid.Container gap={2} justify="space-between" alignItems="center">
                    <Grid xs={24} md={12}>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div style={{ height: '32px', width: '24px' }}>
                                    <svg viewBox="0 0 384 512" style={{ height: '100%', width: 'auto' }}>
                                        <defs>
                                            <linearGradient id="suiGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#4DA2FF" />
                                                <stop offset="100%" stopColor="#3D5E99" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M192 0C86 0 0 172 0 286.5c0 124.5 86 225.5 192 225.5s192-101 192-225.5C384 172 298 0 192 0z"
                                            fill="url(#suiGradientFooter)"
                                            style={{ filter: 'drop-shadow(0 0 10px rgba(77, 162, 255, 0.4))' }}
                                        />
                                    </svg>
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-geist-sans)',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    letterSpacing: '-0.5px',
                                    color: '#fff'
                                }}>
                                    SUI <span style={{ fontWeight: 300, opacity: 0.6 }}>COMMERCE</span>
                                </span>
                            </div>
                            <Text p small className="text-gray-500 m-0" style={{ maxWidth: '300px' }}>
                                The premier decentralized marketplace built on the Sui Network. Fast, secure, and verifiable.
                            </Text>
                        </div>
                    </Grid>
                    <Grid xs={24} md={12}>
                        <div className="flex gap-6 justify-end text-sm text-gray-500">
                            <span>Powered by Sui</span>
                            <span>Secure & Fast</span>
                            <span>Verified Assets</span>
                        </div>
                    </Grid>
                </Grid.Container>
                <div className="mt-8 text-center">
                    <Text p small className="text-gray-400">
                        &copy; {new Date().getFullYear()} Sui Commerce. All rights reserved.
                    </Text>
                </div>
            </div>
        </footer>
    );
}
