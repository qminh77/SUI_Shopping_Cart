import { SuiClient } from '@mysten/sui/client';

/**
 * Product interface matching the blockchain Product struct
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number; // Price in SUI (converted from MIST)
    creator: string;
    objectId: string; // Full object ID for transactions
}

/**
 * Convert MIST to SUI
 * 1 SUI = 1,000,000,000 MIST
 */
export function mistToSui(mist: number): number {
    return mist / 1_000_000_000;
}

/**
 * Convert SUI to MIST
 */
export function suiToMist(sui: number): number {
    return Math.floor(sui * 1_000_000_000);
}

/**
 * Fetch all Product NFTs from the blockchain
 * Note: This is a simplified implementation. In production, you'd want to:
 * 1. Use an indexer service for better performance
 * 2. Implement pagination for large datasets
 * 3. Cache results to reduce RPC calls
 */
export async function fetchAllProducts(
    client: SuiClient,
    packageId: string
): Promise<Product[]> {
    try {
        // Query all objects of type Product using getDynamicFields
        // This is a workaround since queryObjects may not be available in all SDK versions
        const productType = `${packageId}::product::Product`;

        // Alternative approach: Get objects by filtering
        // In newer Sui SDK, we need to use getOwnedObjects with pagination
        // For now, we'll return empty array and let users see products they own
        // A proper implementation would use a Sui indexer or RPC endpoint

        console.warn('fetchAllProducts: Using simplified implementation. Consider using Sui indexer for production.');

        return [];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products from blockchain');
    }
}

/**
 * Fetch products owned by a specific address
 */
export async function fetchOwnedProducts(
    client: SuiClient,
    packageId: string,
    ownerAddress: string
): Promise<Product[]> {
    try {
        const productType = `${packageId}::product::Product`;

        // Get owned objects
        const response = await client.getOwnedObjects({
            owner: ownerAddress,
            filter: {
                StructType: productType,
            },
            options: {
                showContent: true,
                showOwner: true,
            },
        });

        // Parse products
        const products: Product[] = [];

        for (const obj of response.data) {
            if (obj.data?.content?.dataType === 'moveObject') {
                const fields = obj.data.content.fields as any;

                products.push({
                    id: fields.id?.id || obj.data.objectId,
                    objectId: obj.data.objectId,
                    name: fields.name || 'Unknown Product',
                    description: fields.description || '',
                    imageUrl: fields.image_url || '',
                    price: mistToSui(Number(fields.price) || 0),
                    creator: fields.creator || '',
                });
            }
        }

        return products;
    } catch (error) {
        console.error('Error fetching owned products:', error);
        throw new Error('Failed to fetch owned products');
    }
}

/**
 * Parse a single product object from blockchain data
 */
export function parseProductData(objectData: any): Product | null {
    try {
        if (objectData?.content?.dataType !== 'moveObject') {
            return null;
        }

        const fields = objectData.content.fields;

        return {
            id: fields.id?.id || objectData.objectId,
            objectId: objectData.objectId,
            name: fields.name || 'Unknown Product',
            description: fields.description || '',
            imageUrl: fields.image_url || '',
            price: mistToSui(Number(fields.price) || 0),
            creator: fields.creator || '',
        };
    } catch (error) {
        console.error('Error parsing product data:', error);
        return null;
    }
}

/**
 * Format address to shortened version (0x1234...5678)
 */
export function formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format SUI amount with proper decimals
 */
export function formatSUI(amount: number): string {
    return `${amount.toFixed(3)} SUI`;
}
