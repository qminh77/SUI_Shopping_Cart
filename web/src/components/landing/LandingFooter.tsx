'use client';

import React from 'react';
import { Github, Twitter, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function LandingFooter() {
    return (
        <footer className="relative z-10 w-full border-t border-white/10 bg-black py-16 text-white">
            <div className="mx-auto max-w-7xl px-4 md:px-12">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:gap-24">

                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="text-2xl font-black tracking-tighter uppercase mb-4">SUI Commerce</h2>
                        <p className="max-w-xs text-sm text-gray-400">
                            The next generation decentralized marketplace built on the SUI blockchain.
                            Own your data, own your shop, own your future.
                        </p>
                        <div className="mt-6 flex gap-4">
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Github className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                                <MessageCircle className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="col-span-1">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Platform</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/shop" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link></li>
                            <li><Link href="/seller/dashboard" className="text-gray-400 hover:text-white transition-colors">Seller Dashboard</Link></li>
                            <li><Link href="/auth" className="text-gray-400 hover:text-white transition-colors">Login / Register</Link></li>
                            <li><Link href="/cart" className="text-gray-400 hover:text-white transition-colors">My Cart</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-1">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Legal</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Dispute Resolution</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 flex flex-col items-center justify-between border-t border-white/5 pt-8 md:flex-row text-xs text-gray-600">
                    <p>© 2026 SUI Commerce. All rights reserved.</p>
                    <p className="mt-2 md:mt-0">Designed by Antigravity</p>
                </div>
            </div>
        </footer>
    );
}
