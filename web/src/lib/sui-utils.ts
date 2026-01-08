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
    stock: number; // Available inventory quantity
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
    quantity: number;
    buyer: string;
    seller: string;
    pricePaid: number; // Unit Price
    totalPaid: number; // Total Transaction
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
        // Move numbers are returned as strings in JSON
        price: Number(fields.price || 0),
        stock: Number(fields.stock || 0),
        creator: fields.creator,
        listed: true, // Legacy field, always true for display if found
        createdAt: Number(fields.created_at || 0),
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
        quantity: Number(fields.quantity || 1),
        buyer: fields.buyer,
        seller: fields.seller,
        pricePaid: Number(fields.price_paid),
        totalPaid: Number(fields.total_paid || fields.price_paid),
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
 * Get SUI Kiosk ID for a specific address
 */
export async function getKioskId(client: SuiClient, address: string): Promise<string | undefined> {
    try {
        const { data } = await client.getOwnedObjects({
            owner: address,
            filter: {
                StructType: '0x2::kiosk::KioskOwnerCap'
            },
            options: {
                showContent: true
            }
        });

        if (data.length === 0) return undefined;

        // KioskOwnerCap has a 'for' field containing the Kiosk ID
        const fields = (data[0].data?.content as any)?.fields;
        return fields?.for;
    } catch (e) {
        console.error('Error fetching Kiosk ID:', e);
        return undefined;
    }
}

/**
 * Get all products inside a Kiosk
 */
export async function getKioskProducts(client: SuiClient, kioskId: string): Promise<Product[]> {
    try {
        // Kiosk implementation uses Dynamic Object Fields to store items
        // We fetch all dynamic fields and filter for our Product type
        let allData: any[] = [];
        let cursor: string | null | undefined = null;
        let hasNextPage = true;

        // Safety limit to prevent infinite loops
        let pages = 0;
        const MAX_PAGES = 50;

        while (hasNextPage && pages < MAX_PAGES) {
            const res = await client.getDynamicFields({
                parentId: kioskId,
                cursor,
            });

            allData = [...allData, ...res.data];
            cursor = res.nextCursor;
            hasNextPage = res.hasNextPage;
            pages++;
        }

        console.log(`[getKioskProducts] Raw Dynamic fields found in ${kioskId}:`, allData.length);

        // Filter for fields that hold our Product type
        // Note: checking for exact type match or just containing the type string
        const productFields = allData.filter(item =>
            item.objectType.includes(`${PACKAGE_ID}::product::Product`)
        );

        if (productFields.length === 0) return [];

        const objectIds = productFields.map(item => item.objectId);

        // Fetch the actual product objects
        const objects = await client.multiGetObjects({
            ids: objectIds,
            options: { showContent: true, showOwner: true }
        });

        return objects.map(obj => {
            const product = parseProduct(obj);
            if (product) {
                // Explicitly set kioskId since we found it in a kiosk
                product.kioskId = kioskId;
                return product;
            }
            return null;
        }).filter((p): p is Product => p !== null);

    } catch (e) {
        console.error(`Error fetching products from kiosk ${kioskId}:`, e);
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
        const allProducts: Product[] = [];
        const processedProductIds = new Set<string>();

        // Method 1: Fetch from validated Kiosks (if shops are known)
        if (knownShops && knownShops.length > 0) {
            console.log(`[getAllListedProducts] Checking Kiosks for ${knownShops.length} shops...`);

            await Promise.all(knownShops.map(async (shop) => {
                try {
                    const kioskId = await getKioskId(client, shop.owner);
                    if (kioskId) {
                        // Kiosk holds products as the owner
                        const kioskProducts = await getKioskProducts(client, kioskId);

                        kioskProducts.forEach(p => {
                            if (!processedProductIds.has(p.id)) {
                                allProducts.push(p);
                                processedProductIds.add(p.id);
                            }
                        });
                    }
                } catch (e) {
                    console.error(`Failed to fetch Kiosk items for shop ${shop.id}:`, e);
                }
            }));

            console.log(`[getAllListedProducts] Found ${allProducts.length} items in Kiosks.`);
        }

        // Method 2: Fallback to Events if Kiosk fetch yielded low results or no shops provided
        // This ensures we don't show empty page if Kiosk indexing is slow, 
        // BUT we must be careful not to include unlisted wallet items.
        // For now, if we found items in Kiosks, we return them to be precise.
        // If 0 items, we try events.

        if (allProducts.length > 0) {
            return allProducts;
        }

        console.log('Fetching all products via events (Fallback) from:', PACKAGE_ID);

        // Query ProductCreated events
        const events = await client.queryEvents({
            query: {
                MoveEventType: `${PACKAGE_ID}::product::ProductCreated`
            },
            limit: 50,
            order: 'descending'
        });

        console.log('Product events found:', events.data.length);

        if (events.data.length === 0) return [];

        // Extract object IDs
        // @ts-expect-error - parsedJson type definition missing in SDK events
        const objectIds = events.data.map(e => e.parsedJson?.product_id).filter(Boolean);

        if (objectIds.length === 0) return [];

        // Fetch objects
        const objects = await client.multiGetObjects({
            ids: objectIds,
            options: { showContent: true, showOwner: true }
        });

        const eventProducts = objects.map(obj => {
            try {
                // IMPORTANT: Pass the whole obj to parseProduct, not just fields/id
                return parseProduct(obj);
            } catch (e) {
                console.error('Error parsing product:', e);
                return null;
            }
        }).filter((p): p is Product => p !== null);

        // Filter event products: ONLY include if they are owned by a Kiosk mechanism 
        // (Owner is ObjectOwner, not AddressOwner)
        // This is a heuristic to filter out Wallet items.
        const filteredEventProducts = eventProducts.filter(p => {
            // We can't easily verify if the owner ID is a Kiosk without checking, 
            // but usually Wallet items are AddressOwner.
            // parseProduct sets p.kioskId if owner is ObjectOwner.
            return !!p.kioskId;
        });

        console.log('Parsed and filtered event products:', filteredEventProducts.length);
        return filteredEventProducts;
    } catch (error) {
        console.error('Error getting all listed products:', error);
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
