/// Product NFT Module
/// Defines the Product structure and minting functionality
module sui_ecommerce::product {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;
    use std::string::String;

    /// Product NFT representing an item for sale
    public struct Product has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        price: u64,  // Price in MIST (1 SUI = 1_000_000_000 MIST)
        creator: address,
    }

    /// Mint a new product NFT
    public fun mint(
        name: String,
        description: String,
        image_url: String,
        price: u64,
        ctx: &mut TxContext
    ) {
        let product = Product {
            id: object::new(ctx),
            name,
            description,
            image_url,
            price,
            creator: tx_context::sender(ctx),
        };
        
        // Transfer to the creator
        transfer::public_transfer(product, tx_context::sender(ctx));
    }

    /// Get product details (accessor functions)
    public fun name(product: &Product): &String {
        &product.name
    }

    public fun description(product: &Product): &String {
        &product.description
    }

    public fun image_url(product: &Product): &String {
        &product.image_url
    }

    public fun price(product: &Product): u64 {
        product.price
    }

    public fun creator(product: &Product): address {
        product.creator
    }
}
