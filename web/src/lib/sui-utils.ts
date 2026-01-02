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
        console.log('[getAllShops] Fetching marketplace:', MARKETPLACE_ID);

        const marketplaceObj = await client.getObject({
            id: MARKETPLACE_ID,
            options: { showContent: true },
        });

        if (!marketplaceObj.data?.content || marketplaceObj.data.content.dataType !== 'moveObject') {
            console.error('[getAllShops] Marketplace object not found or invalid');
            return [];
        }

        const fields = marketplaceObj.data.content.fields as any;
        const shopIds = fields.shops as string[];

        console.log(`[getAllShops] Found ${shopIds.length} shop IDs in marketplace`);

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
export async function getAllListedProducts(client: SuiClient): Promise<Product[]> {
    try {
        console.log('[getAllListedProducts] Starting product discovery...');
        console.log('[getAllListedProducts] PACKAGE_ID:', PACKAGE_ID);

        const shops = await getAllShops(client);
        console.log(`[getAllListedProducts] Found ${shops.length} shops`);

        if (shops.length === 0) {
            console.warn('[getAllListedProducts] No shops found in marketplace');
            return [];
        }

        // Initialize Kiosk Client
        const kioskClient = new KioskClient({
            client,
            network: Network.TESTNET,
        });

        // Fetch Kiosks for all shop owners and extract products
        const productsPromises = shops.map(async (shop) => {
            try {
                console.log(`[getAllListedProducts] Checking shop: ${shop.name} (${shop.owner})`);

                const { kioskIds } = await kioskClient.getOwnedKiosks({ address: shop.owner });
                console.log(`[getAllListedProducts] Shop ${shop.name} has ${kioskIds.length} kiosk(s)`);

                if (kioskIds.length === 0) return [];

                // For each kiosk, get items
                const kioskProducts = await Promise.all(kioskIds.map(async (kioskId) => {
                    try {
                        const kiosk = await kioskClient.getKiosk({
                            id: kioskId,
                            options: {
                                withObjects: true,
                                withListingPrices: true,
                            }
                        });

                        console.log(`[getAllListedProducts] Kiosk ${kioskId} has ${kiosk.items.length} item(s)`);

                        if (kiosk.items.length > 0) {
                            console.log('[getAllListedProducts] Sample item types:', kiosk.items.map(i => i.type).join(', '));
                        }

                        // Parse items that match our Product type
                        const products = kiosk.items
                            .filter(item => {
                                const expectedType = `${PACKAGE_ID}::product::Product`;
                                const isProduct = item.type === expectedType;

                                if (!isProduct && kiosk.items.length > 0) {
                                    console.log(`[getAllListedProducts] Type mismatch: expected "${expectedType}", got "${item.type}"`);
                                }

                                return isProduct;
                            })
                            .map(item => {
                                const fields = (item.data?.content as any)?.fields;
                                if (!fields) {
                                    console.warn(`[getAllListedProducts] No fields found for item ${item.objectId}`);
                                    return null;
                                }

                                console.log(`[getAllListedProducts] Found product: ${fields.name}`);

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

                        return products;
                    } catch (kioskErr) {
                        console.error(`[getAllListedProducts] Error fetching kiosk ${kioskId}:`, kioskErr);
                        return [];
                    }
                }));

                return kioskProducts.flat();
            } catch (err) {
                console.error(`[getAllListedProducts] Error processing shop ${shop.id}:`, err);
                return [];
            }
        });

        const allProducts = await Promise.all(productsPromises);
        const flatProducts = allProducts.flat();

        console.log(`[getAllListedProducts] Total products found: ${flatProducts.length}`);

        return flatProducts;

    } catch (error) {
        console.error('[getAllListedProducts] Fatal error:', error);
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
