'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID, parseReceipt, Receipt } from '@/lib/sui-utils';

export function useReceipts(ownerAddress?: string) {
    const client = useSuiClient();

    const { data: receipts, isLoading, refetch } = useQuery({
        queryKey: ['receipts', ownerAddress],
        queryFn: async () => {
            if (!ownerAddress) return [];

            const objects = await client.getOwnedObjects({
                owner: ownerAddress,
                filter: {
                    StructType: `${PACKAGE_ID}::receipt::Receipt`,
                },
                options: { showContent: true },
            });

            return objects.data
                .map(obj => parseReceipt(obj))
                .filter((r): r is Receipt => r !== null)
                .sort((a, b) => b.purchaseDate - a.purchaseDate); // Most recent first
        },
        enabled: !!ownerAddress,
    });

    return {
        receipts: receipts || [],
        isLoading,
        refetch,
    };
}
