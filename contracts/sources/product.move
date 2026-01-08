/// Product NFT Module
/// Defines Product structure with shop association and listing status
module sui_ecommerce::product {
    use sui::package;
    use sui::transfer_policy;
    use sui::object::{Self, UID, ID};
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
        stock: u64,            // Available quantity in inventory
        creator: address,      // Original creator
        listed: bool,          // DEPRECATED - Kiosk is source of truth
        created_at: u64,       // Epoch when created
    }

    use sui::event;

    /// Event emitted when a new product is created
    public struct ProductCreated has copy, drop {
        product_id: ID,
        shop_id: address,
        name: String,
        price: u64,
        stock: u64,
        creator: address,
    }

    /// Event emitted when stock changes
    public struct StockChanged has copy, drop {
        product_id: ID,
        new_stock: u64,
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
        stock: u64,
        ctx: &mut TxContext
    ): Product {
        let id = object::new(ctx);
        let product_id = object::uid_to_inner(&id);
        
        event::emit(ProductCreated {
            product_id,
            shop_id,
            name,
            price,
            stock,
            creator: ctx.sender(),
        });

        let product = Product {
            id,
            shop_id,
            name,
            description,
            image_url,
            price,
            stock,
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
        stock: u64,
        ctx: &mut TxContext
    ) {
        let product = mint(shop_id, name, description, image_url, price, stock, ctx);
        transfer::public_transfer(product, ctx.sender());
    }

    /// Mint and share object (For Retail/Shopee Mode)
    /// This makes the Product a Shared Object, allowing multiple buyers to interact with it.
    public fun create_shared_product(
        shop_id: address,
        name: String,
        description: String,
        image_url: String,
        price: u64,
        stock: u64,
        ctx: &mut TxContext
    ) {
        let product = mint(shop_id, name, description, image_url, price, stock, ctx);
        transfer::public_share_object(product);
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

    /// Get product stock
    public fun stock(product: &Product): u64 {
        product.stock
    }

    /// Decrease stock after purchase (requires mutable reference)
    /// Restricted to package visibility so only the purchase module can call it
    public(package) fun decrease_stock(product: &mut Product, quantity: u64) {
        assert!(product.stock >= quantity, 0); // EStockInsufficient
        product.stock = product.stock - quantity;
        
        event::emit(StockChanged {
            product_id: object::uid_to_inner(&product.id),
            new_stock: product.stock,
        });
    }
}
