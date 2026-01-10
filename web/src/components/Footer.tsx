'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Footer() {
    return (
        <footer className="border-t border-border bg-card mt-auto">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-3 w-fit">
                            <div className="relative h-6 w-16">
                                <Image
                                    src="/logo.svg"
                                    alt="Sui"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-base font-bold text-muted-foreground border-l border-border pl-3">
                                Shop
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Decentralized marketplace on Sui blockchain. Buy and sell verifiable digital assets with instant settlement.
                        </p>
                    </div>

                    {/* Shop Column */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider">Shop</h4>
                        <nav className="flex flex-col space-y-2 text-sm">
                            <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                                All Products
                            </Link>
                            <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                                Categories
                            </Link>
                            <Link href="/seller" className="text-muted-foreground hover:text-foreground transition-colors">
                                Become a Seller
                            </Link>
                        </nav>
                    </div>

                    {/* Account Column */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider">Account</h4>
                        <nav className="flex flex-col space-y-2 text-sm">
                            <Link href="/profile/orders" className="text-muted-foreground hover:text-foreground transition-colors">
                                My Orders
                            </Link>
                            <Link href="/profile/addresses" className="text-muted-foreground hover:text-foreground transition-colors">
                                My Addresses
                            </Link>
                            <Link href="/receipts" className="text-muted-foreground hover:text-foreground transition-colors">
                                Receipts
                            </Link>
                        </nav>
                    </div>

                    {/* Connect Column */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider">Connect</h4>
                        <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                                <Github className="h-4 w-4" />
                                <span className="sr-only">GitHub</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                                <Twitter className="h-4 w-4" />
                                <span className="sr-only">Twitter</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="sr-only">Email</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                    <p>© 2026 SUI Shop. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
