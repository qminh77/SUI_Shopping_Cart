'use client';

import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KioskClient, Network } from '@mysten/kiosk';
import { PACKAGE_ID, TRANSFER_POLICY_ID } from '@/lib/sui-utils';
import { toast } from 'sonner';

export function useKiosk(ownerAddress?: string) {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  // Create KioskClient instance
  const kioskClient = new KioskClient({
    client,
    network: Network.TESTNET,
  });

  // Query user's kiosks
  const { data: kiosks, isLoading: isLoadingKiosks } = useQuery({
    queryKey: ['kiosks', ownerAddress],
    queryFn: async () => {
      if (!ownerAddress) return [];
      const { kioskIds, kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address: ownerAddress });


      // Fetch items for each kiosk
      const kiosksWithItems = await Promise.all(
        kioskIds.map(async (id, index) => {
          const kiosk = await kioskClient.getKiosk({
            id,
            options: {
              withObjects: true,
              withListingPrices: true,
            }
          });

          return {
            id,
            cap: kioskOwnerCaps[index],
            items: kiosk.items,
            itemIds: kiosk.itemIds,
          };
        })
      );

      return kiosksWithItems;
    },
    enabled: !!ownerAddress,
    staleTime: 5 * 60 * 1000, // Cache kiosk data for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Get user's first kiosk (most common case)
  const userKiosk = kiosks && kiosks.length > 0 ? kiosks[0] : null;

  // Create a new Kiosk
  const createKiosk = useMutation({
    mutationFn: async () => {
      const tx = new Transaction();

      // Create personal kiosk
      tx.moveCall({
        target: '0x2::kiosk::default',
        arguments: [],
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kiosks'] });
      toast.success('Kiosk created successfully!');
    },
    onError: (error: any) => {
      console.error('Create kiosk error:', error);
      if (error.message?.includes('No valid gas coins') || error.message?.includes('GasBalanceTooLow')) {
        toast.error('Insufficient SUI for gas. Please claim Testnet SUI.');
      } else {
        toast.error('Failed to create kiosk: ' + (error.message || 'Unknown error'));
      }
    },
  });

  // Place and list an item in kiosk
  const placeAndList = useMutation({
    mutationFn: async (params: {
      productId: string;
      price: number; // in MIST
    }) => {
      if (!userKiosk) {
        throw new Error('No kiosk found. Create a kiosk first.');
      }

      const tx = new Transaction();
      const productType = `${PACKAGE_ID}::product::Product`;

      // Take the product (assuming it's owned by the user)
      const product = tx.object(params.productId);

      // Place in kiosk
      tx.moveCall({
        target: '0x2::kiosk::place',
        arguments: [
          tx.object(userKiosk.id),
          tx.object(userKiosk.cap.objectId),
          product,
        ],
        typeArguments: [productType],
      });

      // List for sale
      tx.moveCall({
        target: '0x2::kiosk::list',
        arguments: [
          tx.object(userKiosk.id),
          tx.object(userKiosk.cap.objectId),
          tx.pure.id(params.productId),
          tx.pure.u64(params.price),
        ],
        typeArguments: [productType],
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kiosks'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      toast.success('Product listed in kiosk!');
    },
    onError: (error) => {
      console.error('Place and list error:', error);
      toast.error('Failed to list product');
    },
  });

  // Purchase from kiosk
  const purchaseFromKiosk = useMutation({
    mutationFn: async (params: {
      kioskId: string;
      productId: string;
      price: number;
      productName: string;
      seller: string;
    }) => {
      if (!account?.address) {
        throw new Error('No account connected');
      }

      // Step 1: Purchase Product
      const tx = new Transaction();
      const productType = `${PACKAGE_ID}::product::Product`;

      // Split coin for payment
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.price)]);

      // Purchase from kiosk
      const [product, request] = tx.moveCall({
        target: '0x2::kiosk::purchase',
        arguments: [
          tx.object(params.kioskId),
          tx.pure.id(params.productId),
          coin,
        ],
        typeArguments: [productType],
      });

      // Confirm with transfer policy
      tx.moveCall({
        target: '0x2::transfer_policy::confirm_request',
        arguments: [
          tx.object(TRANSFER_POLICY_ID),
          request,
        ],
        typeArguments: [productType],
      });

      // Transfer product to buyer
      tx.transferObjects([product], tx.pure.address(account.address));

      const purchaseResult = await signAndExecute({
        transaction: tx,
      });

      // Step 2: Mint Receipt (Separate transaction to include digest)
      try {
        const receiptTx = new Transaction();
        const [receipt] = receiptTx.moveCall({
          target: `${PACKAGE_ID}::receipt::mint_receipt`,
          arguments: [
            receiptTx.pure.address(params.productId),
            receiptTx.pure.string(params.productName),
            receiptTx.pure.address(params.seller),
            receiptTx.pure.u64(params.price),
            receiptTx.pure.string(purchaseResult.digest),
          ],
        });

        receiptTx.transferObjects([receipt], receiptTx.pure.address(account.address));

        await signAndExecute({
          transaction: receiptTx,
        });

        toast.success('Receipt minted!');
      } catch (err) {
        console.error('Failed to mint receipt:', err);
        toast.error('Purchase success, but failed to mint receipt');
      }

      return purchaseResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['kiosks'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Purchase successful!');
    },
    onError: (error) => {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    },
  });

  // Take (Withdraw) from kiosk
  const takeFromKiosk = useMutation({
    mutationFn: async (productId: string) => {
      if (!userKiosk) throw new Error('No kiosk found');

      const tx = new Transaction();
      const productType = `${PACKAGE_ID}::product::Product`;

      // Take from kiosk
      const [item] = tx.moveCall({
        target: '0x2::kiosk::take',
        arguments: [
          tx.object(userKiosk.id),
          tx.object(userKiosk.cap.objectId),
          tx.pure.id(productId),
        ],
        typeArguments: [productType],
      });

      // Transfer back to owner
      tx.transferObjects([item], tx.pure.address(account!.address));

      const result = await signAndExecute({ transaction: tx });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kiosks'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      toast.success('Product removed from Kiosk (Unlisted)');
    },
    onError: (error) => {
      console.error('Take error:', error);
      toast.error('Failed to unlist/take product');
    },
  });

  return {
    // Data
    kiosks,
    userKiosk,
    hasKiosk: !!userKiosk,

    // Loading states
    isLoadingKiosks,
    isCreatingKiosk: createKiosk.isPending,
    isListingProduct: placeAndList.isPending,
    isPurchasing: purchaseFromKiosk.isPending,

    // Mutations
    createKiosk: createKiosk.mutateAsync,
    placeAndList: placeAndList.mutateAsync,
    purchaseFromKiosk: purchaseFromKiosk.mutateAsync,
    takeFromKiosk: takeFromKiosk.mutateAsync,
    isTaking: takeFromKiosk.isPending,
  };
}
