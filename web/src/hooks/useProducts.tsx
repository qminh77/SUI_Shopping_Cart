import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getAllListedProducts,
    getShopProducts,
    PACKAGE_ID,
    Product,
    suiToMist,
} from '@/lib/sui-utils';

/**
 * Hook for product operations
 */
export function useProducts(shopId?: string) {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    // Fetch all listed products or products from a specific shop
    const { data: products, isLoading, error } = useQuery({
        queryKey: shopId ? ['shopProducts', shopId] : ['allProducts'],
        queryFn: async () => {
            if (shopId) {
                return await getShopProducts(client, shopId);
            }

            // Fetch active shops from DB to ensure we check the right kiosks
            let activeShops: { owner: string, id: string }[] = [];
            try {
                const res = await fetch('/api/shops?limit=100');
                if (res.ok) {
                    const json = await res.json();
                    if (json.data && Array.isArray(json.data)) {
                        activeShops = json.data.map((s: any) => ({
                            owner: s.owner_wallet,
                            id: s.id
                        }));
                        console.log('[useProducts] Fetched active shops from DB:', activeShops.length);
                    }
                }
            } catch (e) {
                console.error('[useProducts] Failed to fetch shops from DB:', e);
            }

            return await getAllListedProducts(client, activeShops);
        },
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        gcTime: 5 * 60 * 1000,
    });

    // Fetch user's own products
    const { data: userProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['userProducts', account?.address],
        queryFn: async () => {
            if (!account?.address) return [];

            const { data } = await client.getOwnedObjects({
                owner: account.address,
                filter: {
                    StructType: `${PACKAGE_ID}::product::Product`,
                },
                options: {
                    showContent: true,
                },
            });

            return data.map((obj) => {
                const fields = (obj.data?.content as any)?.fields;
                if (!fields) return null;

                return {
                    id: obj.data!.objectId,
                    shopId: fields.shop_id,
                    name: fields.name,
                    description: fields.description,
                    imageUrl: fields.image_url,
                    price: Number(fields.price),
                    creator: fields.creator,
                    listed: fields.listed,
                    createdAt: Number(fields.created_at),
                } as Product;
            }).filter((p): p is Product => p !== null);
        },
        enabled: !!account?.address,
        staleTime: 3 * 60 * 1000, // Cache for 3 minutes
        gcTime: 10 * 60 * 1000,
    });

    // Create product mutation
    const createProduct = useMutation({
        mutationFn: async ({
            shopId,
            name,
            description,
            imageUrl,
            price,
            stock,
            kioskId,
            kioskCapId,
        }: {
            shopId: string;
            name: string;
            description: string;
            imageUrl: string;
            price: number;
            stock: number;
            kioskId?: string;
            kioskCapId?: string;
        }) => {
            if (!account?.address) throw new Error('Wallet not connected');

            const tx = new Transaction();

            // Convert price from SUI to MIST (required for blockchain)
            const priceInMist = suiToMist(price);

            // Mint and Share the product (Shared Object for Inventory)
            const [product] = tx.moveCall({
                target: `${PACKAGE_ID}::product::mint`,
                arguments: [
                    tx.pure.address(shopId),
                    tx.pure.string(name),
                    tx.pure.string(description),
                    tx.pure.string(imageUrl),
                    tx.pure.u64(priceInMist),
                    tx.pure.u64(stock),
                ],
            });

            // Share the object so it can be bought concurrently
            // Transfer to user so they own it (required for Kiosk placement)
            tx.transferObjects([product], tx.pure.address(account.address));

            const result = await signAndExecute({
                transaction: tx,
            });

            // Manually fetch full response to ensure we have effects and objectChanges
            // (dapp-kit hook might not return them by default, and types prevent passing options)
            if (!result.effects || !(result as any).objectChanges) {
                try {
                    const fullResponse = await client.waitForTransaction({
                        digest: result.digest,
                        options: {
                            showEffects: true,
                            showObjectChanges: true,
                            showEvents: true
                        }
                    });
                    return fullResponse;
                } catch (e) {
                    console.warn('Failed to fetch full transaction details, returning partial result', e);
                    return result;
                }
            }

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProducts'] });
            queryClient.invalidateQueries({ queryKey: ['allProducts'] });
        }
    });


    // Legacy purchaseProduct mutation removed
    // Smart contract doesn't have purchase_product function
    // All purchases must go through Kiosk SDK (use useKiosk hook's purchaseFromKiosk)

    // List/Unlist product mutations
    const toggleProductListing = useMutation({
        mutationFn: async ({ productId, list }: { productId: string; list: boolean }) => {
            if (!account?.address) throw new Error('Wallet not connected');

            return new Promise((resolve, reject) => {
                const tx = new Transaction();

                const functionName = list ? 'list_product' : 'unlist_product';
                tx.moveCall({
                    target: `${PACKAGE_ID}::product::${functionName}`,
                    arguments: [tx.object(productId)],
                });

                signAndExecute(
                    { transaction: tx },
                    {
                        onSuccess: (result) => {
                            toast.success(`Product ${list ? 'listed' : 'unlisted'} successfully!`);
                            queryClient.invalidateQueries({ queryKey: ['userProducts'] });
                            queryClient.invalidateQueries({ queryKey: ['allProducts'] });
                            resolve(result);
                        },
                        onError: (error) => {
                            toast.error(`Failed to ${list ? 'list' : 'unlist'} product`);
                            console.error('Toggle listing error:', error);
                            reject(error);
                        },
                    }
                );
            });
        },
    });

    return {
        products,
        userProducts,
        isLoading,
        isLoadingProducts,
        error,
        createProduct: createProduct.mutateAsync,
        isCreatingProduct: createProduct.isPending,
        // purchaseProduct removed - use useKiosk hook's purchaseFromKiosk instead
        toggleProductListing: toggleProductListing.mutateAsync,
        isTogglingListing: toggleProductListing.isPending,
    };
}
