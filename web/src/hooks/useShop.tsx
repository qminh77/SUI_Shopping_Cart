import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PACKAGE_ID, MARKETPLACE_ID } from '@/lib/sui-utils';

export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export type Shop = {
    id: string;
    owner_wallet: string;
    shop_name: string;
    shop_description: string;
    business_type: 'PERSONAL' | 'BUSINESS';
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
    legal_docs_urls?: string[];
    status: ShopStatus;
    admin_note?: string;
    created_at: string;
    updated_at: string;
    on_chain_shop_id?: string; // NEW: Track the on-chain Shop object ID
};

/**
 * Hook for shop-related operations (Supabase Backend + On-Chain)
 */
export function useShop() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const queryClient = useQueryClient();

    // Fetch user's shop from Supabase
    const { data: shop, isLoading, error } = useQuery<Shop | null>({
        queryKey: ['shop', account?.address],
        queryFn: async () => {
            if (!account?.address) return null;
            const res = await fetch(`/api/shops/me?wallet=${account.address}`);

            // Only throw on actual errors, not on 404/null responses
            if (!res.ok) {
                const errorData = await res.json();
                if (errorData?.error) {
                    throw new Error(errorData.error);
                }
                throw new Error('Failed to fetch shop');
            }

            // Return the shop or null if not found
            const data = await res.json();
            return data;
        },
        enabled: !!account?.address,
        retry: false,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });

    // Create shop mutation (ON-CHAIN + Database)
    const createShop = useMutation({
        mutationFn: async (data: any) => {
            if (!account?.address) throw new Error('Wallet not connected');

            // Step 1: Create Shop on-chain and register in Marketplace
            console.log('[useShop] Creating shop on-chain...');
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::shop::create_shop`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.pure.string(data.shop_name),
                    tx.pure.string(data.shop_description),
                ],
            });

            const result = await signAndExecute({ transaction: tx });
            console.log('[useShop] On-chain shop created:', result.digest);

            // Step 2: Save to Supabase database
            console.log('[useShop] Saving shop to database...');
            const res = await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    owner_wallet: account?.address,
                    transaction_digest: result.digest, // Store the transaction for reference
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save shop to database');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success('Shop created successfully! Awaiting admin approval.');
            queryClient.invalidateQueries({ queryKey: ['shop', account?.address] });
        },
        onError: (err: any) => {
            console.error('[useShop] Create shop error:', err);
            toast.error(err.message || 'Failed to create shop');
        }
    });

    // Update shop mutation
    const updateShop = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/shops/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    wallet: account?.address
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update shop');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Shop updated successfully');
            queryClient.invalidateQueries({ queryKey: ['shop', account?.address] });
        },
        onError: (err: any) => {
            toast.error(err.message);
        }
    });

    return {
        shop,
        isLoading,
        error,
        isError: !!error,
        createShop,
        updateShop,
        isShopActive: shop?.status === 'ACTIVE'
    };
}
