'use client';

import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID } from '@/lib/sui-utils';
import { toast } from 'sonner';
import { createOrder } from '@/services/order.service';

export function useRetail() {
    const client = useSuiClient();
    const account = useCurrentAccount();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const queryClient = useQueryClient();

    // Buy Retail Product (Shared Object)
    const buyProduct = useMutation({
        mutationFn: async (params: {
            product: any; // The generic product object
            quantity: number;
            shippingAddress: {
                fullName: string;
                phone: string;
                address: string;
                city: string;
            }
        }) => {
            if (!account?.address) throw new Error('No account connected');

            const tx = new Transaction();

            // Calculate total price
            const totalPrice = BigInt(params.product.price) * BigInt(params.quantity);

            // Split coin
            const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPrice)]);

            // Call purchase::buy_shared
            // public entry fun buy_shared(product: &mut Product, quantity: u64, payment: &mut Coin<SUI>, ctx: &mut TxContext)
            const ticket = tx.moveCall({
                target: `${PACKAGE_ID}::purchase::buy_shared`,
                arguments: [
                    tx.object(params.product.id), // Shared Object ID
                    tx.pure.u64(params.quantity),
                    payment
                ]
            });

            // Execute transaction
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

            // Create Order in Database (Off-chain)
            // We do this AFTER the on-chain transaction succeeds
            try {
                await createOrder({
                    transaction_digest: result.digest,
                    buyer_wallet: account.address,
                    seller_wallet: params.product.creator, // or shop owner
                    total_price: Number(totalPrice), // Store as number for DB (watch out for large int)
                    shipping_address: params.shippingAddress,
                    items: [{
                        product_id: params.product.id,
                        product_name: params.product.name,
                        quantity: params.quantity,
                        price: Number(params.product.price)
                    }]
                });
            } catch (dbError) {
                console.error('Failed to create order in DB:', dbError);
                toast.error('Purchase succeeded but Order creation failed. Please contact support.');
                // Don't throw here, the money is already sent.
            }

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['retailProducts'] });
            toast.success('Ordered successfully!');
        },
        onError: (error) => {
            console.error('Buy error:', error);
            toast.error('Failed to buy product');
        },
    });

    return {
        buyProduct: buyProduct.mutateAsync,
        isBuying: buyProduct.isPending,
    };
}
