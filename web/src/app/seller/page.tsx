'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { WalletConnection } from '@/components/WalletConnection';
import Link from 'next/link';

export default function SellerPage() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        setIsLoading(true);

        try {
            const tx = new Transaction();
            const priceInMist = Math.floor(parseFloat(formData.price) * 1_000_000_000);

            tx.moveCall({
                target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::product::mint`,
                arguments: [
                    tx.pure.string(formData.name),
                    tx.pure.string(formData.description),
                    tx.pure.string(formData.imageUrl),
                    tx.pure.u64(priceInMist),
                ],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        toast.success('Product created successfully!');
                        console.log('Transaction result:', result);
                        setFormData({ name: '', description: '', imageUrl: '', price: '' });
                    },
                    onError: (error) => {
                        toast.error('Failed to create product');
                        console.error('Transaction error:', error);
                    },
                }
            );
        } catch (error) {
            toast.error('An error occurred');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded bg-primary" />
                                <span className="text-xl font-semibold">Sui Commerce</span>
                            </Link>
                            <WalletConnection />
                        </div>
                    </div>
                </header>

                <div className="flex items-center justify-center min-h-[80vh]">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Wallet Required</CardTitle>
                            <CardDescription>
                                Please connect your Sui wallet to access the seller dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                You'll need a connected wallet to create and manage product NFTs.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-primary" />
                            <span className="text-xl font-semibold">Sui Commerce</span>
                        </Link>
                        <WalletConnection />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Seller Dashboard</h1>
                    <p className="text-muted-foreground">
                        Create and manage your product NFTs on the Sui blockchain
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Create Product Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Product NFT</CardTitle>
                            <CardDescription>
                                Mint a new product as an NFT that can be listed on the marketplace
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateProduct} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Digital Artwork #1"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe your product in detail..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">Image URL *</Label>
                                    <Input
                                        id="imageUrl"
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Provide a publicly accessible URL for your product image
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (SUI) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="0.000"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Set the price in SUI tokens (1 SUI = 1,000,000,000 MIST)
                                    </p>
                                </div>

                                <Separator />

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isLoading ? 'Creating...' : 'Create Product NFT'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Setup Guide */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Setup Instructions</CardTitle>
                            <CardDescription>
                                Follow these steps before creating your first product
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Deploy Smart Contracts</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Build and deploy the Move contracts to Sui testnet using the CLI
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Configure Package ID</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Set <code className="bg-muted px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_PACKAGE_ID</code> in your environment
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Fund Your Wallet</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ensure you have sufficient SUI tokens for gas fees
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <h4 className="font-semibold text-sm">What happens when you create?</h4>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Product is minted as an NFT on Sui blockchain</li>
                                    <li>You become the verified owner</li>
                                    <li>Metadata is stored on-chain permanently</li>
                                    <li>Product can be listed in marketplaces</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
