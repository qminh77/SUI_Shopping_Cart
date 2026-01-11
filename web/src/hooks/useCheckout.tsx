'use client';

import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID, Product } from '@/lib/sui-utils';
import { toast } from 'sonner';

interface CheckoutItem extends Product {
    quantity: number;
}

export function useCheckout() {
    const client = useSuiClient();
    const account = useCurrentAccount();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const queryClient = useQueryClient();

    const checkout = useMutation({
        mutationFn: async (params: {
            items: CheckoutItem[];
            shippingAddress: {
                fullName: string;
                phone: string;
                address: string;
                city: string;
            }
        }) => {
            if (!account?.address) throw new Error('No account connected');
            if (params.items.length === 0) throw new Error('Cart is empty');

            const tx = new Transaction();

            // Calculate amounts for splitCoins
            // For Retail/Shared items: Cost = Price * Quantity
            const amounts = params.items.map(item => {
                return BigInt(item.price) * BigInt(item.quantity);
            });

            // Split coins from Gas
            const coins = tx.splitCoins(tx.gas, amounts.map(a => tx.pure.u64(a)));

            // Iterate and build commands (Pure Retail Mode)
            params.items.forEach((item, index) => {
                const paymentCoin = coins[index];

                // Call purchase::buy_shared
                tx.moveCall({
                    target: `${PACKAGE_ID}::purchase::buy_shared`,
                    arguments: [
                        tx.object(item.id), // Shared Product ID
                        tx.pure.u64(item.quantity),
                        paymentCoin
                    ]
                });
            });

            // Execute PTB
            const result = await signAndExecute({
                transaction: tx,
            });

            // Wait for effects
            if (!result.effects) {
                await client.waitForTransaction({
                    digest: result.digest,
                    options: { showEffects: true }
                });
            }

            // Create Orders in DB (Grouped by Seller)
            const itemsBySeller = params.items.reduce((acc, item) => {
                if (!acc[item.creator]) {
                    acc[item.creator] = [];
                }
                acc[item.creator].push(item);
                return acc;
            }, {} as Record<string, CheckoutItem[]>);

            const dbPromises = Object.entries(itemsBySeller).map(async ([seller, sellerItems]) => {
                const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                // Call API to create order
                return fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transaction_digest: result.digest,
                        buyer_wallet: account.address,
                        seller_wallet: seller,
                        total_price: sellerTotal,
                        shipping_address: params.shippingAddress,
                        items: sellerItems.map(item => ({
                            product_id: item.id,
                            product_name: item.name,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    })
                }).then(res => {
                    if (!res.ok) throw new Error('API failed');
                    return res.json();
                });
            });

            try {
                await Promise.all(dbPromises);
            } catch (dbError) {
                console.error('One or more DB orders failed:', dbError);
                toast.error('Purchase successful, but order history might be incomplete.');
            }

            // Sync product stock from blockchain to database
            // This ensures the UI displays updated stock after purchase
            const syncPromises = params.items.map(async (item) => {
                try {
                    const syncResponse = await fetch('/api/products/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: item.id })
                    });

                    if (!syncResponse.ok) {
                        console.error(`Failed to sync product ${item.id} stock`);
                    } else {
                        console.log(`Product ${item.id} stock synced successfully`);
                    }
                } catch (syncError) {
                    console.error(`Error syncing product ${item.id}:`, syncError);
                }
            });

            try {
                await Promise.all(syncPromises);
            } catch (syncError) {
                console.error('Some products failed to sync:', syncError);
                // Don't show error to user - this is a background operation
            }

            return { result };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['retailProducts'] });
            // We can also invalidate my-retail-products for seller view update if self-buying (unlikely but safe)
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });
            toast.success('Purchase successful!');
        },
        onError: (error) => {
            console.error('Checkout error:', error);
            toast.error('Checkout failed. Please try again.');
        }
    });

    return {
        checkout: checkout.mutateAsync,
        isProcessing: checkout.isPending
    };
}
