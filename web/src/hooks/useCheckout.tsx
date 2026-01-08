'use client';

import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID, TRANSFER_POLICY_ID, Product } from '@/lib/sui-utils';
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
            const productType = `${PACKAGE_ID}::product::Product`;

            // Calculate amounts for splitCoins
            // We need to split coin for EACH item action to be safe and clear
            const amounts = params.items.map(item => {
                // If Kiosk: quantity is usually 1 per objectId, but if we have multiple quantity in cart for same ID, 
                // it implies logic constraint. For Shared Object: quantity * price.

                // Logic check:
                // Kiosk Item: quantity usually 1. If > 1, it means we selected multiple DISTINCT items? 
                // Or does the cart group them?
                // The current Cart groups by ID. 
                // Kiosk NFTs have unique IDs. So `quantity` > 1 for a specific `id` is impossible for unique NFTs.
                // UNLESS it's a SFT in a Kiosk (less common for this template).
                // Retail Item (Shared): `quantity` > 1 is valid, same `id` (shared object id).

                return BigInt(item.price) * BigInt(item.quantity);
            });

            // Split coins from Gas
            const coins = tx.splitCoins(tx.gas, amounts.map(a => tx.pure.u64(a)));

            // Iterate and build commands
            params.items.forEach((item, index) => {
                const paymentCoin = coins[index];

                if (item.kioskId) {
                    // --- KIOSK PURCHASE FLOW ---
                    // Note: Kiosk purchase assumes quantity = 1 per Object ID usually.
                    // If cart has quantity > 1 for a Kiosk item, it might be a bug in how we add unique NFTs to cart.
                    // But assuming quantity=1 for now as per previous logic.

                    const [product, request] = tx.moveCall({
                        target: '0x2::kiosk::purchase',
                        arguments: [
                            tx.object(item.kioskId),
                            tx.pure.id(item.id),
                            paymentCoin
                        ],
                        typeArguments: [productType]
                    });

                    tx.moveCall({
                        target: '0x2::transfer_policy::confirm_request',
                        arguments: [
                            tx.object(TRANSFER_POLICY_ID),
                            request
                        ],
                        typeArguments: [productType]
                    });

                    // Mint Receipt
                    const receipt = tx.moveCall({
                        target: `${PACKAGE_ID}::receipt::mint_receipt`,
                        arguments: [
                            tx.pure.address(item.id), // ID as address
                            tx.pure.string(item.name),
                            tx.pure.u64(1),
                            tx.pure.address(item.creator),
                            tx.pure.u64(item.price),
                            tx.pure.string('Hybrid Checkout'),
                        ]
                    });

                    tx.transferObjects([receipt], tx.pure.address(account.address));
                    tx.transferObjects([product], tx.pure.address(account.address));

                } else {
                    // --- RETAIL (SHARED OBJECT) PURCHASE FLOW ---
                    tx.moveCall({
                        target: `${PACKAGE_ID}::purchase::buy_shared`,
                        arguments: [
                            tx.object(item.id), // Shared Product ID
                            tx.pure.u64(item.quantity),
                            paymentCoin
                        ]
                    });

                    // Receipt is minted inside `buy_shared` and transferred to sender.
                    // Event is emitted inside `buy_shared`.
                }
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

            return { result };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['retailProducts'] });
            queryClient.invalidateQueries({ queryKey: ['kiosks'] });
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
