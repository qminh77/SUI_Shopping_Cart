/// Shop Module - Multi-shop marketplace with global discovery
/// Manages individual shops and a global marketplace registry
module sui_ecommerce::shop {
    use sui::event;
    use std::string::String;

    /// Shop represents an individual seller's storefront
    public struct Shop has key, store {
        id: UID,
        owner: address,
        name: String,
        description: String,
        created_at: u64,
    }

    /// Marketplace is a shared object that tracks all shops
    public struct Marketplace has key {
        id: UID,
        shops: vector<address>,  // List of all shop object IDs
    }

    /// Capability proving shop ownership
    public struct ShopOwnerCap has key, store {
        id: UID,
        shop_id: address,
        shop_name: String,
    }

    // ====== Events ======

    /// Emitted when a new shop is created
    public struct ShopCreated has copy, drop {
        shop_id: address,
        owner: address,
        name: String,
    }

    // ====== Init Function ======

    /// Initialize the marketplace (called once on publish)
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            shops: vector::empty<address>(),
        };
        
        // Share the marketplace object so anyone can read it
        transfer::share_object(marketplace);
    }

    // ====== Shop Management Functions ======

    /// Create a new shop and register it in the marketplace
    public fun create_shop(
        marketplace: &mut Marketplace,
        name: String,
        description: String,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let shop_uid = object::new(ctx);
        let shop_id = object::uid_to_address(&shop_uid);
        
        // Create the shop object
        let shop = Shop {
            id: shop_uid,
            owner: sender,
            name,
            description,
            created_at: ctx.epoch(),
        };
        
        // Create ownership capability
        let shop_cap = ShopOwnerCap {
            id: object::new(ctx),
            shop_id,
            shop_name: shop.name,
        };
        
        // Register shop in marketplace
        marketplace.shops.push_back(shop_id);
        
        // Emit event
        event::emit(ShopCreated {
            shop_id,
            owner: sender,
            name: shop.name,
        });
        
        // Transfer shop to owner (so they control it)
        transfer::transfer(shop, sender);
        
        // Transfer capability to owner
        transfer::transfer(shop_cap, sender);
    }

    // ====== Accessor Functions ======

    /// Get shop owner address
    public fun get_shop_owner(shop: &Shop): address {
        shop.owner
    }

    /// Get shop name
    public fun get_shop_name(shop: &Shop): &String {
        &shop.name
    }

    /// Get shop description
    public fun get_shop_description(shop: &Shop): &String {
        &shop.description
    }

    /// Get all shops in marketplace
    public fun get_marketplace_shops(marketplace: &Marketplace): &vector<address> {
        &marketplace.shops
    }
}
