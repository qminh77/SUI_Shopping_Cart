'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useReceipts } from '@/hooks/useReceipts';
import { ReceiptCard } from '@/components/ReceiptCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function ReceiptsPage() {
    const account = useCurrentAccount();
    const { receipts, isLoading } = useReceipts(account?.address);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">My Receipts</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-5xl">
                {!account ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Connect Wallet Required</h2>
                        <p className="text-muted-foreground max-w-md">
                            Please connect your wallet to view your purchase history and receipts.
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : receipts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No Receipts Found</h2>
                        <p className="text-muted-foreground max-w-md">
                            You haven't made any purchases yet. When you buy items from the marketplace,
                            your NFT receipts will appear here.
                        </p>
                        <div className="mt-6">
                            <Link href="/">
                                <Button>Browse Marketplace</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {receipts.map(receipt => (
                            <ReceiptCard key={receipt.id} receipt={receipt} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
