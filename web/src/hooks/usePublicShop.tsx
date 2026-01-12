'use client';

import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { getShopProducts, Product, PACKAGE_ID, parseProduct } from '@/lib/sui-utils';

interface ShopData {
    id: string;
    owner_wallet: string;
    shop_name: string;
    shop_description: string;
    business_type: string;
    tax_code?: string;
    established_year: number;
    website?: string;
    contact_email: string;
    contact_phone: string;
    address_city: string;
    address_detail: string;
    logo_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    support_policy?: string;
    return_policy?: string;
    warranty_policy?: string;
    on_chain_shop_id?: string; // ✨ NEW: Blockchain shop ID for product fetching
    status: string;
    created_at: string;
    updated_at: string;
}

/**
 * Hook to fetch public shop information and products
 * @param walletAddress - Owner wallet address of the shop
 */
export function usePublicShop(walletAddress: string) {
    const client = useSuiClient();

    // Fetch shop information from database
    const { data: shopData, isLoading: isLoadingShop, error: shopError } = useQuery({
        queryKey: ['publicShop', walletAddress],
        queryFn: async () => {
            const response = await fetch(`/api/shops/${walletAddress}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Shop not found');
                }
                throw new Error('Failed to fetch shop data');
            }

            const data = await response.json();
            return data.shop as ShopData;
        },
        enabled: !!walletAddress,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 1,
    });

    // ✨ FIXED: Fetch shop products from blockchain using on_chain_shop_id if available
    const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery<Product[]>({
        queryKey: ['publicShopProducts', walletAddress, shopData?.on_chain_shop_id],
        queryFn: async () => {
            // Strategy 1: If shop has on_chain_shop_id, fetch products by shop_id match
            if (shopData?.on_chain_shop_id) {
                console.log('[usePublicShop] Fetching products by on_chain_shop_id:', shopData.on_chain_shop_id);

                // Query ProductCreated events and filter by shop_id
                try {
                    const events = await client.queryEvents({
                        query: { MoveEventType: `${PACKAGE_ID}::product::ProductCreated` },
                        limit: 100,
                        order: 'descending'
                    });

                    const productIds = events.data
                        .map(e => (e.parsedJson as any)?.product_id)
                        .filter(Boolean);

                    if (productIds.length === 0) return [];

                    // Fetch products and filter by shop_id
                    const objects = await client.multiGetObjects({
                        ids: productIds,
                        options: { showContent: true, showOwner: true }
                    });

                    const shopProducts = objects
                        .map(obj => parseProduct(obj))
                        .filter((p): p is Product =>
                            p !== null && p.shopId === shopData.on_chain_shop_id
                        );

                    console.log(`[usePublicShop] Found ${shopProducts.length} products for shop ${shopData.on_chain_shop_id}`);
                    return shopProducts;
                } catch (error) {
                    console.error('[usePublicShop] Error fetching by on_chain_shop_id:', error);
                    // Fallback to wallet address method
                }
            }

            // Strategy 2: Fallback - fetch products owned by wallet address
            // This works for shops that don't have on_chain_shop_id set yet
            console.log('[usePublicShop] Fetching products by wallet address:', walletAddress);
            return await getShopProducts(client, walletAddress);
        },
        enabled: !!walletAddress && !!shopData, // Wait for shop data to be loaded
        staleTime: 30 * 1000,          // 30 seconds (faster stock updates)
        gcTime: 2 * 60 * 1000,         // 2 minutes
        refetchOnWindowFocus: true,    // Auto-refresh when switching back to tab
        refetchInterval: 60 * 1000,    // Poll every 60s for real-time sync
    });

    return {
        shop: shopData,
        products,
        isLoading: isLoadingShop || isLoadingProducts,
        isLoadingShop,
        isLoadingProducts,
        error: shopError || productsError,
    };
}
