import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { KioskClient, Network } from '@mysten/kiosk';

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
        const shopIds = new Set<string>();

        // Method 1: Query ShopCreated events (Most robust way to find all shops)
        try {
            console.log('[getAllShops] Querying ShopCreated events...');
            const events = await client.queryEvents({
                query: {
                    MoveModule: {
                        package: PACKAGE_ID,
                        module: 'shop'
                    }
                },
                limit: 50,
                order: 'descending'
            });

            events.data.forEach(event => {
                if (event.type.includes('::ShopCreated')) {
                    const parsed = event.parsedJson as any;
                    const id = parsed.shop_id || parsed.id;
                    if (id) shopIds.add(id);
                }
            });
            console.log(`[getAllShops] Found ${shopIds.size} shops via events`);
        } catch (eventError) {
            console.error('[getAllShops] Event query failed:', eventError);
        }

        // Method 2: Marketplace Registry (Fallback)
        if (shopIds.size === 0) {
            console.log('[getAllShops] Fetching marketplace:', MARKETPLACE_ID);
            const marketplaceObj = await client.getObject({
                id: MARKETPLACE_ID,
                options: { showContent: true },
            });

            if (marketplaceObj.data?.content && marketplaceObj.data.content.dataType === 'moveObject') {
                const fields = marketplaceObj.data.content.fields as any;

                if (Array.isArray(fields.shops)) {
                    fields.shops.forEach((id: string) => shopIds.add(id));
                }
            }
        }

        if (shopIds.size === 0) {
            console.warn('[getAllShops] No shops found via Events or Registry');
            return [];
        }

        const uniqueIds = Array.from(shopIds);

        // Fetch all shop objects
        const shops = await Promise.all(
            uniqueIds.map(async (id) => {
                const shopObj = await client.getObject({
                    id,
                    options: { showContent: true },
                });
                return parseShop(shopObj);
            })
        );

        const validShops = shops.filter((s): s is Shop => s !== null);
        console.log(`[getAllShops] Parsed ${validShops.length} valid shops`);

        return validShops;
    } catch (error) {
        console.error('Error fetching all shops:', error);
        return [];
    }
}

/**
 * Get all listed products across all shops (from Kiosks)
 */
export async function getAllListedProducts(
    client: SuiClient,
    knownShops?: { owner: string, id: string }[]
): Promise<Product[]> {
    try {
        let shops: { owner: string, id: string }[] = [];

        if (knownShops && knownShops.length > 0) {
            console.log(`[getAllListedProducts] Using ${knownShops.length} known shops from DB`);
            shops = knownShops;
        } else {
            console.log('[getAllListedProducts] Discovering shops from chain...');
            shops = await getAllShops(client);
        }

        if (shops.length === 0) return [];

        // Initialize Kiosk Client (keep this for future Kiosk support)
        const kioskClient = new KioskClient({
            client,
            network: Network.TESTNET,
        });

        // Loop through each shop to find products
        const productsPromises = shops.map(async (shop) => {
            const shopProducts: Product[] = [];

            // 1. Fetch products directly owned by the shop owner (Wallet)
            try {
                const { data } = await client.getOwnedObjects({
                    owner: shop.owner,
                    filter: {
                        StructType: `${PACKAGE_ID}::product::Product`,
                    },
                    options: {
                        showContent: true,
                    },
                });

                const directProducts = data.map(parseProduct).filter((p): p is Product => p !== null);
                shopProducts.push(...directProducts);
            } catch (err) {
                console.error(`[getAllListedProducts] Error fetching owned objects for ${shop.id}:`, err);
            }

            // 2. Fetch products in Kiosks (Keep as fallback/advanced feature)
            try {
                const { kioskIds } = await kioskClient.getOwnedKiosks({ address: shop.owner });
                if (kioskIds.length > 0) {
                    const kioskProducts = await Promise.all(kioskIds.map(async (kioskId) => {
                        try {
                            const kiosk = await kioskClient.getKiosk({
                                id: kioskId,
                                options: { withObjects: true, withListingPrices: true }
                            });
                            return kiosk.items
                                .filter(item => item.type.startsWith(`${PACKAGE_ID}::product::Product`))
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
                                        kioskId: kioskId
                                    } as Product;
                                })
                                .filter((p): p is Product => p !== null);
                        } catch (e) { return []; }
                    }));
                    shopProducts.push(...kioskProducts.flat());
                }
            } catch (err) {
                // Ignore Kiosk errors for now if simple ownership works
                // console.warn(`[getAllListedProducts] Kiosk check failed for ${shop.id}`);
            }

            return shopProducts;
        });

        const allProducts = await Promise.all(productsPromises);
        const flatList = allProducts.flat();
        console.log(`[getAllListedProducts] Found ${flatList.length} products total.`);
        return flatList;
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
