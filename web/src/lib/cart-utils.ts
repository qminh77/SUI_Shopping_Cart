import { Product } from './sui-utils';

export interface CartItem extends Product {
    quantity: number;
}

export interface StockValidationResult {
    valid: boolean;
    outOfStock: CartItem[];
    insufficientStock: Array<{
        product: CartItem;
        available: number;
        requested: number;
    }>;
}

/**
 * Validates cart items against current product stock
 * 
 * @param cartItems - Items in cart to validate
 * @param freshProducts - Current product data from database/blockchain
 * @returns Validation result with details of any stock issues
 */
export function validateCartStock(
    cartItems: CartItem[],
    freshProducts: Product[]
): StockValidationResult {
    const outOfStock: CartItem[] = [];
    const insufficientStock: Array<{
        product: CartItem;
        available: number;
        requested: number;
    }> = [];

    for (const cartItem of cartItems) {
        // Find current stock for this product
        const fresh = freshProducts.find(p => p.id === cartItem.id);

        // Product no longer exists or removed
        if (!fresh) {
            console.warn(`[Stock Validation] Product ${cartItem.id} no longer available`);
            outOfStock.push(cartItem);
            continue;
        }

        // Check if completely out of stock
        if (fresh.stock === 0) {
            console.warn(`[Stock Validation] Product ${cartItem.id} (${cartItem.name}) is out of stock`);
            outOfStock.push(cartItem);
            continue;
        }

        // Check if requested quantity exceeds available stock
        if (fresh.stock < cartItem.quantity) {
            console.warn(
                `[Stock Validation] Product ${cartItem.id} (${cartItem.name}) - ` +
                `Requested: ${cartItem.quantity}, Available: ${fresh.stock}`
            );
            insufficientStock.push({
                product: cartItem,
                available: fresh.stock,
                requested: cartItem.quantity
            });
        }
    }

    const isValid = outOfStock.length === 0 && insufficientStock.length === 0;

    if (isValid) {
        console.log('[Stock Validation] All items in stock ✓');
    } else {
        console.log(
            `[Stock Validation] Issues found - Out of stock: ${outOfStock.length}, ` +
            `Insufficient: ${insufficientStock.length}`
        );
    }

    return {
        valid: isValid,
        outOfStock,
        insufficientStock
    };
}
