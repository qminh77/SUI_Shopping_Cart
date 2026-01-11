'use client';

import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { getShopProducts, Product } from '@/lib/sui-utils';

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

    // Fetch shop products from blockchain
    const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery<Product[]>({
        queryKey: ['publicShopProducts', walletAddress],
        queryFn: async () => {
            return await getShopProducts(client, walletAddress);
        },
        enabled: !!walletAddress,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
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
