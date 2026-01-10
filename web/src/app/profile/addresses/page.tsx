'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AddressList } from '@/components/addresses/AddressList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AddressesPage() {
    const account = useCurrentAccount();

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col bg-transparent text-white">
                <Navigation />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
                        <p className="text-white/60 mb-6">
                            Please connect your wallet to manage delivery addresses
                        </p>
                        <Link href="/shop">
                            <Button className="bg-blue-500 hover:bg-blue-600">
                                Go to Shop
                            </Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-transparent text-white">
            <Navigation />

            <main className="flex-1 relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Back Button */}
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>

                    {/* Address List Component */}
                    <AddressList />
                </div>
            </main>

            <Footer />
        </div>
    );
}
