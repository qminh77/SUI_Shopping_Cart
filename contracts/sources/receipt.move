/// Receipt NFT Module
/// Generates immutable proof-of-purchase NFTs for transactions
module sui_ecommerce::receipt {
    use std::string::String;

    /// Receipt NFT - proof of purchase
    public struct Receipt has key, store {
        id: UID,
        product_id: address,      // Product that was purchased
        product_name: String,      // Snapshot of product name
        quantity: u64,             // Number of units purchased
        buyer: address,            // Who bought it
        seller: address,           // Who sold it
        price_paid: u64,          // Unit price in MIST
        total_paid: u64,          // Total amount paid (quantity * price_paid)
        purchase_date: u64,       // Epoch timestamp
        transaction_digest: String, // TX hash for verification
    }

    /// Mint a receipt NFT after successful purchase
    public fun mint_receipt(
        product_id: address,
        product_name: String,
        quantity: u64,
        seller: address,
        price_paid: u64,
        transaction_digest: String,
        ctx: &mut TxContext
    ): Receipt {
        let total_paid = price_paid * quantity;
        Receipt {
            id: object::new(ctx),
            product_id,
            product_name,
            quantity,
            buyer: ctx.sender(),
            seller,
            price_paid,
            total_paid,
            purchase_date: ctx.epoch(),
            transaction_digest,
        }
    }

    // ====== Accessor Functions ======

    /// Get product ID from receipt
    public fun product_id(receipt: &Receipt): address {
        receipt.product_id
    }

    /// Get buyer address
    public fun buyer(receipt: &Receipt): address {
        receipt.buyer
    }

    /// Get seller address
    public fun seller(receipt: &Receipt): address {
        receipt.seller
    }

    /// Get price paid
    public fun price_paid(receipt: &Receipt): u64 {
        receipt.price_paid
    }

    /// Get purchase date
    public fun purchase_date(receipt: &Receipt): u64 {
        receipt.purchase_date
    }

    /// Get product name
    public fun product_name(receipt: &Receipt): &String {
        &receipt.product_name
    }

    /// Get transaction digest
    public fun transaction_digest(receipt: &Receipt): &String {
        &receipt.transaction_digest
    }
}
