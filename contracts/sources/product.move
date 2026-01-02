/// Product NFT Module
/// Defines Product structure with shop association and listing status
module sui_ecommerce::product {
    use sui::package;
    use sui::transfer_policy;
    use std::string::String;

    /// OTW for the module
    public struct PRODUCT has drop {}

    /// Product NFT representing an item for sale
    public struct Product has key, store {
        id: UID,
        shop_id: address,      // Shop this product belongs to
        name: String,
        description: String,
        image_url: String,
        price: u64,            // Price in MIST (1 SUI = 1_000_000_000 MIST)
        creator: address,      // Original creator
        listed: bool,          // DEPRECATED - Kiosk is source of truth
        created_at: u64,       // Epoch when created
    }

    /// Init module: claim publisher and create transfer policy
    fun init(otw: PRODUCT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        
        // Create and share a generic TransferPolicy for Product
        let (policy, policy_cap) = transfer_policy::new<Product>(&publisher, ctx);
        
        transfer::public_share_object(policy);
        transfer::public_transfer(policy_cap, ctx.sender());
        transfer::public_transfer(publisher, ctx.sender());
    }

    /// Mint a new product NFT linked to a shop
    public fun mint(
        shop_id: address,
        name: String,
        description: String,
        image_url: String,
        price: u64,
        ctx: &mut TxContext
    ): Product {
        let product = Product {
            id: object::new(ctx),
            shop_id,
            name,
            description,
            image_url,
            price,
            creator: ctx.sender(),
            listed: false,  // Default to false, Kiosk will handle listing
            created_at: ctx.epoch(),
        };
        
        product
    }

    /// Mint and transfer to sender (Helper)
    public fun mint_to_sender(
        shop_id: address,
        name: String,
        description: String,
        image_url: String,
        price: u64,
        ctx: &mut TxContext
    ) {
        let product = mint(shop_id, name, description, image_url, price, ctx);
        transfer::public_transfer(product, ctx.sender());
    }

    // ====== Accessor Functions ======

    /// Get product name
    public fun name(product: &Product): &String {
        &product.name
    }

    /// Get product description
    public fun description(product: &Product): &String {
        &product.description
    }

    /// Get product image URL
    public fun image_url(product: &Product): &String {
        &product.image_url
    }

    /// Get product price
    public fun price(product: &Product): u64 {
        product.price
    }

    /// Get product creator
    public fun creator(product: &Product): address {
        product.creator
    }

    /// Get shop ID this product belongs to
    public fun shop_id(product: &Product): address {
        product.shop_id
    }

    /// Check if product is listed for sale
    public fun is_listed(product: &Product): bool {
        product.listed
    }

    /// Get product creation timestamp
    public fun created_at(product: &Product): u64 {
        product.created_at
    }
}
