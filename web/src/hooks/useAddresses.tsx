'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import {
    getAddresses,
    getDefaultAddress,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    validateAddressInput
} from '@/services/addresses.service';
import { Address, AddressInput } from '@/lib/sui-utils';

/**
 * Hook for address management
 */
export function useAddresses() {
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const walletAddress = account?.address;

    // Fetch all addresses
    const { data: addresses = [], isLoading, error, refetch } = useQuery<Address[]>({
        queryKey: ['addresses', walletAddress],
        queryFn: () => walletAddress ? getAddresses(walletAddress) : Promise.resolve([]),
        enabled: !!walletAddress,
        staleTime: 3 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Get default address
    const { data: defaultAddress } = useQuery<Address | null>({
        queryKey: ['addresses', 'default', walletAddress],
        queryFn: () => walletAddress ? getDefaultAddress(walletAddress) : Promise.resolve(null),
        enabled: !!walletAddress,
        staleTime: 3 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Create address mutation
    const createMutation = useMutation({
        mutationFn: (data: AddressInput) => {
            if (!walletAddress) throw new Error('Wallet not connected');

            // Validate input
            const errors = validateAddressInput(data);
            if (errors.length > 0) {
                throw new Error(errors.join('. '));
            }

            return createAddress(walletAddress, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses', walletAddress] });
            queryClient.invalidateQueries({ queryKey: ['addresses', 'default', walletAddress] });
            toast.success('Address created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create address: ${error.message}`);
        }
    });

    // Update address mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AddressInput> }) => {
            // Validate if full input provided
            if (data.full_name || data.phone || data.address_line1) {
                const errors = validateAddressInput(data as AddressInput);
                if (errors.length > 0) {
                    throw new Error(errors.join('. '));
                }
            }

            return updateAddress(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses', walletAddress] });
            queryClient.invalidateQueries({ queryKey: ['addresses', 'default', walletAddress] });
            toast.success('Address updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update address: ${error.message}`);
        }
    });

    // Delete address mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses', walletAddress] });
            queryClient.invalidateQueries({ queryKey: ['addresses', 'default', walletAddress] });
            toast.success('Address deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete address: ${error.message}`);
        }
    });

    // Set default address mutation
    const setDefaultMutation = useMutation({
        mutationFn: (id: string) => {
            if (!walletAddress) throw new Error('Wallet not connected');
            return setDefaultAddress(id, walletAddress);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses', walletAddress] });
            queryClient.invalidateQueries({ queryKey: ['addresses', 'default', walletAddress] });
            toast.success('Default address updated');
        },
        onError: (error: Error) => {
            toast.error(`Failed to set default address: ${error.message}`);
        }
    });

    return {
        // Data
        addresses,
        defaultAddress,
        isLoading,
        error,

        // Actions
        createAddress: createMutation.mutateAsync,
        updateAddress: updateMutation.mutateAsync,
        deleteAddress: deleteMutation.mutateAsync,
        setDefaultAddress: setDefaultMutation.mutateAsync,
        refetch,

        // Mutation states
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isSettingDefault: setDefaultMutation.isPending
    };
}

/**
 * Hook to get single address by ID
 */
export function useAddressById(id: string | null) {
    return useQuery<Address | null>({
        queryKey: ['address', id],
        queryFn: () => id ? getAddressById(id) : Promise.resolve(null),
        enabled: !!id,
        staleTime: 3 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
