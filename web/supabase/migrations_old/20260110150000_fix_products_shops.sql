-- Fix Products and Shops Schema
-- Add missing columns for proper blockchain synchronization

-- Add creator_wallet to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS creator_wallet text;

-- Add seller_wallet to products table (same as creator for retail products)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_wallet text;

-- Add indexes for seller queries
CREATE INDEX IF NOT EXISTS products_seller_wallet_idx ON products(seller_wallet);
CREATE INDEX IF NOT EXISTS products_creator_wallet_idx ON products(creator_wallet);

-- Add on_chain_shop_id to shops table to link to blockchain
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS on_chain_shop_id text;

-- Add index for on-chain shop ID lookups
CREATE INDEX IF NOT EXISTS shops_on_chain_id_idx ON shops(on_chain_shop_id);

-- Update existing products to set seller_wallet and creator_wallet from shop_id (temporary fix for existing data)
UPDATE products 
SET 
    seller_wallet = COALESCE(seller_wallet, shop_id),
    creator_wallet = COALESCE(creator_wallet, shop_id)
WHERE seller_wallet IS NULL OR creator_wallet IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN products.creator_wallet IS 'Blockchain wallet address that created this product';
COMMENT ON COLUMN products.seller_wallet IS 'Blockchain wallet address of the seller (usually same as creator for retail products)';
COMMENT ON COLUMN shops.on_chain_shop_id IS 'Object ID of the shop on the SUI blockchain';
