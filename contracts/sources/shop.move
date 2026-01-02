/// Shop Module - Manages Kiosk-based marketplace
/// Integrates with Sui Kiosk for product listing and sales
module sui_ecommerce::shop {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::coin;
    use sui::coin::Coin;
    use sui::sui::SUI;
    use sui_ecommerce::product;
    use sui_ecommerce::product::Product;

    /// Shop owner capability
    public struct ShopOwnerCap has key, store {
        id: UID,
        shop_id: address,
    }

    /// Create a new shop (will integrate with Kiosk in production)
    public fun create_shop(ctx: &mut TxContext) {
        let shop_cap = ShopOwnerCap {
            id: object::new(ctx),
            shop_id: tx_context::sender(ctx),
        };
        
        transfer::public_transfer(shop_cap, tx_context::sender(ctx));
    }

    /// Purchase a product (simplified version)
    /// In production, this will use Kiosk's purchase function
    public fun purchase_product(
        product_item: Product,
        payment: Coin<SUI>,
        seller: address,
        ctx: &mut TxContext
    ) {
        // Verify payment amount matches product price
        let product_price = product::price(&product_item);
        assert!(coin::value(&payment) >= product_price, 0);

        // Transfer payment to seller
        transfer::public_transfer(payment, seller);

        // Transfer product to buyer
        transfer::public_transfer(product_item, tx_context::sender(ctx));
    }
}
