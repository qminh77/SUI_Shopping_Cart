'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Image from 'next/image';
import { formatSUI, formatAddress, suiToMist } from '@/lib/sui-utils';

interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    creator: string;
    objectId: string;
}

interface PurchaseDialogProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function PurchaseDialog({ product, open, onOpenChange, onSuccess }: PurchaseDialogProps) {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isPurchasing, setIsPurchasing] = useState(false);

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

    const handlePurchase = async () => {
        if (!account || !product || !PACKAGE_ID) {
            toast.error('Unable to complete purchase');
            return;
        }

        // Prevent buying your own product
        if (product.creator === account.address) {
            toast.error('You cannot purchase your own product');
            return;
        }

        setIsPurchasing(true);

        try {
            const tx = new Transaction();
            const priceInMist = suiToMist(product.price);

            // Split coins to get exact payment amount
            const [coin] = tx.splitCoins(tx.gas, [priceInMist]);

            // Call shop::purchase_product
            tx.moveCall({
                target: `${PACKAGE_ID}::shop::purchase_product`,
                arguments: [
                    tx.object(product.objectId), // product_item
                    coin, // payment
                    tx.pure.address(product.creator), // seller
                ],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        toast.success('Purchase successful!', {
                            description: 'The NFT has been transferred to your wallet',
                        });
                        console.log('Purchase transaction:', result);
                        onOpenChange(false);
                        onSuccess?.();
                    },
                    onError: (error) => {
                        toast.error('Purchase failed', {
                            description: error.message || 'Transaction was rejected or failed',
                        });
                        console.error('Purchase error:', error);
                    },
                }
            );
        } catch (error) {
            toast.error('An error occurred during purchase');
            console.error('Error:', error);
        } finally {
            setIsPurchasing(false);
        }
    };

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Purchase NFT</DialogTitle>
                    <DialogDescription>
                        Review the details and confirm your purchase
                    </DialogDescription>
                </DialogHeader>

                <Card className="overflow-hidden">
                    {product.imageUrl && (
                        <div className="relative h-48 w-full bg-muted">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                        <div>
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {product.description}
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-semibold text-lg">{formatSUI(product.price)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Seller</span>
                                <code className="font-mono text-xs">
                                    {formatAddress(product.creator)}
                                </code>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Buyer</span>
                                <code className="font-mono text-xs">
                                    {account ? formatAddress(account.address) : 'Not connected'}
                                </code>
                            </div>
                        </div>

                        <Separator />

                        <div className="bg-muted/50 p-3 rounded-md text-xs space-y-1">
                            <p className="font-semibold">Transaction Details:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                <li>Payment will be transferred to seller</li>
                                <li>NFT will be transferred to your wallet</li>
                                <li>Transaction is irreversible</li>
                                <li>Network fees apply</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPurchasing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePurchase}
                        disabled={isPurchasing || !account}
                    >
                        {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
