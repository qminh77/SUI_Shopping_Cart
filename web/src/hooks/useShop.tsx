import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUserShop, PACKAGE_ID, MARKETPLACE_ID, Shop } from '@/lib/sui-utils';

/**
 * Hook for shop-related operations
 */
export function useShop() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const queryClient = useQueryClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    // Fetch user's shop
    const { data: userShop, isLoading, error } = useQuery({
        queryKey: ['userShop', account?.address],
        queryFn: () => {
            if (!account?.address) return null;
            return getUserShop(client, account.address);
        },
        enabled: !!account?.address,
    });

    // Create shop mutation
    const createShop = useMutation({
        mutationFn: async ({ name, description }: { name: string; description: string }) => {
            if (!account?.address) throw new Error('Wallet not connected');

            return new Promise((resolve, reject) => {
                const tx = new Transaction();

                tx.moveCall({
                    target: `${PACKAGE_ID}::shop::create_shop`,
                    arguments: [
                        tx.object(MARKETPLACE_ID),
                        tx.pure.string(name),
                        tx.pure.string(description),
                    ],
                });

                signAndExecute(
                    { transaction: tx },
                    {
                        onSuccess: (result) => {
                            toast.success('Shop created successfully!');
                            queryClient.invalidateQueries({ queryKey: ['userShop'] });
                            resolve(result);
                        },
                        onError: (error) => {
                            toast.error('Failed to create shop');
                            console.error('Create shop error:', error);
                            reject(error);
                        },
                    }
                );
            });
        },
    });

    return {
        userShop,
        isLoading,
        error,
        createShop: createShop.mutateAsync,
        isCreatingShop: createShop.isPending,
    };
}
