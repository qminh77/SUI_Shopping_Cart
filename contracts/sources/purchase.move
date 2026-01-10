/// Purchase Module
/// Handles buying products (shared object version) with atomic stock management
module sui_ecommerce::purchase {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::event;
    use sui::object;
    use std::string;
    use sui_ecommerce::product::{Self, Product};
    use sui_ecommerce::receipt;

    /// Error codes
    const EStockInsufficient: u64 = 0;
    const EPaymentInsufficient: u64 = 1;

    /// Purchase event
    public struct PurchaseEvent has copy, drop {
        seller: address,
        buyer: address,
        product_id: address,
        quantity: u64,
        price: u64,
        timestamp: u64,
    }

    /// Purchase a product by paying SUI (Shared Object Version)
    /// This function handles payment transfer, stock deduction (atomic), and receipt minting
    public entry fun buy_shared(
        product: &mut Product,
        quantity: u64,
        payment: &mut Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 1. Check stock
        assert!(product::stock(product) >= quantity, EStockInsufficient);

        // 2. Calculate total price
        let price = product::price(product);
        let total_amount = price * quantity;

        // 3. Check payment
        assert!(coin::value(payment) >= total_amount, EPaymentInsufficient);

        // 4. Split payment
        let paid_coin = coin::split(payment, total_amount, ctx);

        // 5. Transfer payment to seller
        let seller = product::creator(product);
        transfer::public_transfer(paid_coin, seller);

        // 6. Decrease stock (Atomic)
        // Accessing package-restricted function in same package
        product::decrease_stock(product, quantity);

        // 7. Mint Receipt
        let product_addr = object::id_address(product);
        let product_id = object::id(product);
        
        let receipt = receipt::mint_receipt(
            product_addr,
            *product::name(product),
            quantity,
            seller,
            price,
            string::utf8(b"Purchase"), 
            ctx
        );

        transfer::public_transfer(receipt, ctx.sender());

        // 8. Emit Event
        event::emit(PurchaseEvent {
            seller,
            buyer: ctx.sender(),
            product_id: object::id_to_address(&product_id),
            quantity,
            price,
            timestamp: ctx.epoch()
        });
    }
}
