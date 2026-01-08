    /// Purchase a product by paying SUI (Shared Object Version)
    /// This function handles payment transfer, stock deduction (atomic), and receipt minting
    public entry fun buy_shared(
        product: &mut Product,
        quantity: u64,
        payment: &mut Coin<SUI>,
        ctx: &mut TxContext
    ) {
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
        // Accessing restricted function in same package
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

        transfer::public_transfer(receipt, tx_context::sender(ctx));

        // 8. Emit Event
        event::emit(PurchaseEvent {
            seller,
            buyer: tx_context::sender(ctx),
            product_id,
            quantity,
            price,
            timestamp: tx_context::epoch(ctx)
        });
    }
}
