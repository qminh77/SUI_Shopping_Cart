import { useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
};

/**
 * Hook for shop-related operations (Supabase Backend)
 */
export function useShop() {
    const account = useCurrentAccount();
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
        retry: false, // Don't retry on errors
    });

    // Create shop mutation
    const createShop = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    owner_wallet: account?.address
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create shop');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Shop registration submitted!');
            queryClient.invalidateQueries({ queryKey: ['shop', account?.address] });
        },
        onError: (err: any) => {
            toast.error(err.message);
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
