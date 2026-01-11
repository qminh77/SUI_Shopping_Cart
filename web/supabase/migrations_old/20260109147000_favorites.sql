-- Migration: Favorites Table
-- Created: 2026-01-09
-- Purpose: Wishlist / Saved products feature

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and product
    buyer_wallet TEXT NOT NULL,
    product_id TEXT NOT NULL,
    
    -- Optional metadata
    note TEXT,                              -- Personal note about why saved
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE favorites IS 
    'User wishlist - saved products for later purchase';
COMMENT ON COLUMN favorites.note IS 
    'Optional personal note (e.g., "Gift for mom", "Buy on payday")';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User's favorites lookup
CREATE INDEX idx_favorites_buyer ON favorites(buyer_wallet, created_at DESC);

-- Product popularity (how many users favorited this product)
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- Prevent duplicate favorites
CREATE UNIQUE INDEX idx_favorites_unique ON favorites(buyer_wallet, product_id);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Validate wallet format
ALTER TABLE favorites ADD CONSTRAINT favorites_wallet_check
    CHECK (is_valid_sui_wallet(buyer_wallet));

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can only view their own favorites
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Users can add to their favorites
CREATE POLICY "Users can create own favorites" ON favorites
    FOR INSERT
    WITH CHECK (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Users can remove from their favorites
CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Users can update their favorites (note field)
CREATE POLICY "Users can update own favorites" ON favorites
    FOR UPDATE
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
    WITH CHECK (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if product is in user's favorites
CREATE OR REPLACE FUNCTION is_favorited(
    p_buyer_wallet TEXT,
    p_product_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM favorites
        WHERE buyer_wallet = p_buyer_wallet
          AND product_id = p_product_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get favorite count for a product (popularity metric)
CREATE OR REPLACE FUNCTION get_favorite_count(p_product_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    fav_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fav_count
    FROM favorites
    WHERE product_id = p_product_id;
    
    RETURN fav_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user's favorites with product details
CREATE OR REPLACE FUNCTION get_user_favorites(
    p_buyer_wallet TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    favorite_id UUID,
    product_id TEXT,
    product_name TEXT,
    product_price BIGINT,
    product_stock INTEGER,
    product_image_url TEXT,
    note TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id AS favorite_id,
        p.id AS product_id,
        p.name AS product_name,
        p.price AS product_price,
        p.stock AS product_stock,
        p.image_url AS product_image_url,
        f.note,
        f.created_at
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.buyer_wallet = p_buyer_wallet
    ORDER BY f.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_favorites IS 
    'Returns user favorites with full product details';

-- Toggle favorite (add if not exists, remove if exists)
CREATE OR REPLACE FUNCTION toggle_favorite(
    p_buyer_wallet TEXT,
    p_product_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    is_now_favorited BOOLEAN;
BEGIN
    -- Try to delete first
    DELETE FROM favorites
    WHERE buyer_wallet = p_buyer_wallet
      AND product_id = p_product_id;
    
    -- If deleted, return false (unfavorited)
    IF FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Otherwise, insert (favorite)
    INSERT INTO favorites (buyer_wallet, product_id)
    VALUES (p_buyer_wallet, p_product_id)
    ON CONFLICT (buyer_wallet, product_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION toggle_favorite IS 
    'Toggle favorite status - returns TRUE if favorited, FALSE if unfavorited';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-cleanup favorites when product is deleted from products table
CREATE OR REPLACE FUNCTION cleanup_favorites_on_product_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM favorites
    WHERE product_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_cleanup_favorites
    AFTER DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_favorites_on_product_delete();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Most favorited products (trending/popular products)
CREATE OR REPLACE VIEW most_favorited_products AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock,
    p.image_url,
    p.category_id,
    COUNT(f.id) AS favorite_count
FROM products p
LEFT JOIN favorites f ON f.product_id = p.id
WHERE p.stock > 0
GROUP BY p.id, p.name, p.price, p.stock, p.image_url, p.category_id
HAVING COUNT(f.id) > 0
ORDER BY COUNT(f.id) DESC, p.created_at DESC
LIMIT 100;

COMMENT ON VIEW most_favorited_products IS 
    'Top 100 most favorited products (popularity ranking)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'favorites'
    ), 'Favorites table should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_favorites_unique'
    ), 'Unique constraint should prevent duplicate favorites';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'toggle_favorite'
    ), 'toggle_favorite function should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_views 
        WHERE viewname = 'most_favorited_products'
    ), 'most_favorited_products view should exist';
    
    RAISE NOTICE 'Favorites table verified successfully';
END $$;
