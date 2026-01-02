import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';

// Package and Marketplace IDs from deployment
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
export const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;
export const TRANSFER_POLICY_ID = process.env.NEXT_PUBLIC_TRANSFER_POLICY_ID!;

// Type definitions
export interface Product {
    id: string;
    shopId: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number; // in MIST
    creator: string;
    listed: boolean;
    createdAt: number;
    kioskId?: string; // ID of the Kiosk holding this product
}

export interface Shop {
    id: string;
    owner: string;
    name: string;
    description: string;
    createdAt: number;
}

export interface Receipt {
    id: string;
    productId: string;
    productName: string;
    buyer: string;
    seller: string;
    pricePaid: number;
    purchaseDate: number;
    transactionDigest: string;
}

/**
 * Parse a Product object from blockchain response
 */
export function parseProduct(obj: SuiObjectResponse): Product | null {
    if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = obj.data.content.fields as any;

    // Check if owner is a Kiosk (shared object or address owned)
    // Note: Kiosks are shared objects usually, but items inside point to Kiosk as owner
    let kioskId: string | undefined;
    if (obj.data.owner && typeof obj.data.owner === 'object' && 'ObjectOwner' in obj.data.owner) {
        kioskId = obj.data.owner.ObjectOwner;
    }

    return {
        id: obj.data.objectId,
        shopId: fields.shop_id,
        name: fields.name,
        description: fields.description,
        imageUrl: fields.image_url,
        price: Number(fields.price),
        creator: fields.creator,
        listed: fields.listed,
        createdAt: Number(fields.created_at),
        kioskId,
    };
}

/**
 * Parse a Shop object from blockchain response
 */
export function parseShop(obj: SuiObjectResponse): Shop | null {
    if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = obj.data.content.fields as any;

    return {
        id: obj.data.objectId,
        owner: fields.owner,
        name: fields.name,
        description: fields.description,
        createdAt: Number(fields.created_at),
    };
}

/**
 * Parse a Receipt object from blockchain response
 */
export function parseReceipt(obj: SuiObjectResponse): Receipt | null {
    if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = obj.data.content.fields as any;

    return {
        id: obj.data.objectId,
        productId: fields.product_id,
        productName: fields.product_name,
        buyer: fields.buyer,
        seller: fields.seller,
        pricePaid: Number(fields.price_paid),
        purchaseDate: Number(fields.purchase_date),
        transactionDigest: fields.transaction_digest,
    };
}

/**
 * Get user's shop if they own one
 */
export async function getUserShop(
    client: SuiClient,
    address: string
): Promise<Shop | null> {
    try {
        const { data } = await client.getOwnedObjects({
            owner: address,
            filter: {
                StructType: `${PACKAGE_ID}::shop::ShopOwnerCap`,
            },
            options: {
                showContent: true,
            },
        });

        if (data.length === 0) return null;

        // Get the shop_id from ShopOwnerCap
        const capFields = (data[0].data?.content as any)?.fields;
        if (!capFields) return null;

        const shopId = capFields.shop_id;

        // Fetch the actual Shop object
        const shopObj = await client.getObject({
            id: shopId,
            options: { showContent: true },
        });

        return parseShop(shopObj);
    } catch (error) {
        console.error('Error fetching user shop:', error);
        return null;
    }
}


/**
 * Get all products from a specific shop owner
 */
export async function getShopProducts(
    client: SuiClient,
    shopOwner: string
): Promise<Product[]> {
    try {
        // Fetch all products owned by the shop owner
        const { data } = await client.getOwnedObjects({
            owner: shopOwner,
            filter: {
                StructType: `${PACKAGE_ID}::product::Product`,
            },
            options: {
                showContent: true,
            },
        });

        return data
            .map(parseProduct)
            .filter((p): p is Product => p !== null);
    } catch (error) {
        console.error('Error fetching shop products:', error);
        return [];
    }
}

/**
 * Get all products owned by an address (Inventory)
 */
export async function getOwnedProducts(
    client: SuiClient,
    ownerAddress: string
): Promise<Product[]> {
    return getShopProducts(client, ownerAddress);
}

/**
 * Get all shops from marketplace
 */
export async function getAllShops(client: SuiClient): Promise<Shop[]> {
    try {
        const marketplaceObj = await client.getObject({
            id: MARKETPLACE_ID,
            options: { showContent: true },
        });

        if (!marketplaceObj.data?.content || marketplaceObj.data.content.dataType !== 'moveObject') {
            return [];
        }

        const fields = marketplaceObj.data.content.fields as any;
        const shopIds = fields.shops as string[];

        // Fetch all shop objects
        const shops = await Promise.all(
            shopIds.map(async (id) => {
                const shopObj = await client.getObject({
                    id,
                    options: { showContent: true },
                });
                return parseShop(shopObj);
            })
        );

        return shops.filter((s): s is Shop => s !== null);
    } catch (error) {
        console.error('Error fetching all shops:', error);
        return [];
    }
}

/**
 * Get all listed products across all shops
 */
import { KioskClient, Network } from '@mysten/kiosk';

/**
 * Get all listed products across all shops (from Kiosks)
 */
export async function getAllListedProducts(client: SuiClient): Promise<Product[]> {
    try {
        const shops = await getAllShops(client);

        // Initialize Kiosk Client
        const kioskClient = new KioskClient({
            client,
            network: Network.TESTNET,
        });

        // Fetch Kiosks for all shop owners and extract products
        const productsPromises = shops.map(async (shop) => {
            try {
                const { kioskIds } = await kioskClient.getOwnedKiosks({ address: shop.owner });

                // For each kiosk, get items
                const kioskProducts = await Promise.all(kioskIds.map(async (id) => {
                    const kiosk = await kioskClient.getKiosk({
                        id,
                        options: {
                            withObjects: true,
                        }
                    });

                    // Parse items that match our Product type
                    return kiosk.items
                        .filter(item => item.type === `${PACKAGE_ID}::product::Product`)
                        .map(item => {
                            const fields = (item.data?.content as any)?.fields;
                            if (!fields) return null;

                            return {
                                id: item.data!.objectId,
                                shopId: fields.shop_id,
                                name: fields.name,
                                description: fields.description,
                                imageUrl: fields.image_url,
                                price: Number(fields.price),
                                creator: fields.creator,
                                listed: true,
                                createdAt: Number(fields.created_at),
                                kioskId: id
                            } as Product;
                        })
                        .filter((p): p is Product => p !== null);
                }));

                return kioskProducts.flat();
            } catch (err) {
                console.error(`Error fetching products for shop ${shop.id}:`, err);
                return [];
            }
        });

        const allProducts = await Promise.all(productsPromises);
        return allProducts.flat();

    } catch (error) {
        console.error('Error fetching all listed products:', error);
        return [];
    }
}

/**
 * Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
 */
export function suiToMist(sui: number): number {
    return Math.floor(sui * 1_000_000_000);
}

/**
 * Convert MIST to SUI
 */
export function mistToSui(mist: number): number {
    return mist / 1_000_000_000;
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string, length: number = 8): string {
    if (!address) return '';
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
}
