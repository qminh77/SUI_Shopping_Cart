-- Migration: Products Table (Blockchain Indexer)
-- Created: 2026-01-09
-- Purpose: Cache on-chain products for fast search and filtering

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE products (
    -- On-chain identifier (primary key)
    id TEXT PRIMARY KEY,                    -- Sui Object ID (0x...)
    
    -- Basic product information
    shop_id TEXT NOT NULL,                  -- Seller's wallet address
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Pricing and inventory
    price BIGINT NOT NULL CHECK (price >= 0),  -- In MIST (1 SUI = 1B MIST)
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    
    -- Categorization
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Blockchain sync metadata
    on_chain_created_at BIGINT,             -- Unix timestamp from blockchain
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
    
    -- Database timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Full-text search vector (auto-generated)
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    ) STORED
);

COMMENT ON TABLE products IS 
    'Indexed product catalog synced from blockchain for fast queries';
COMMENT ON COLUMN products.id IS 
    'On-chain Sui Object ID - unique identifier from blockchain';
COMMENT ON COLUMN products.price IS 
    'Price in MIST (1,000,000,000 MIST = 1 SUI)';
COMMENT ON COLUMN products.search_vector IS 
    'Auto-generated full-text search index (name weighted higher than description)';
COMMENT ON COLUMN products.last_synced_at IS 
    'Last time this product was synced from blockchain';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Shop products query (seller dashboard)
CREATE INDEX idx_products_shop ON products(shop_id) 
    WHERE stock > 0;

-- Category filtering
CREATE INDEX idx_products_category ON products(category_id) 
    WHERE stock > 0 AND category_id IS NOT NULL;

-- Available products (most common query on shop page)
CREATE INDEX idx_products_available ON products(stock, created_at DESC) 
    WHERE stock > 0;

-- Full-text search index (GIN for fast text search)
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Price range queries
CREATE INDEX idx_products_price ON products(price) 
    WHERE stock > 0;

-- Sync status monitoring
CREATE INDEX idx_products_sync_status ON products(sync_status, last_synced_at)
    WHERE sync_status != 'synced';

-- Composite index for common shop page query (category + available + price sort)
CREATE INDEX idx_products_shop_page ON products(category_id, stock, price)
    WHERE stock > 0;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update last_synced_at when syncing from blockchain
CREATE OR REPLACE FUNCTION products_update_sync_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update sync time if actual product data changed
    IF (NEW.price IS DISTINCT FROM OLD.price) OR
       (NEW.stock IS DISTINCT FROM OLD.stock) OR
       (NEW.name IS DISTINCT FROM OLD.name) THEN
        NEW.last_synced_at := NOW();
        NEW.sync_status := 'synced';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_sync_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION products_update_sync_time();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can view products with stock
CREATE POLICY "Public can view available products" ON products
    FOR SELECT
    USING (stock > 0);

-- Shop owners can view and manage their own products
CREATE POLICY "Owners can manage their products" ON products
    FOR ALL
    USING (shop_id = current_setting('request.jwt.claims', true)::json->>'wallet')
    WITH CHECK (shop_id = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Note: The above RLS uses JWT claims. For testing without auth, you may need to disable RLS temporarily:
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to search products by text
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT,
    category_filter UUID DEFAULT NULL,
    min_price BIGINT DEFAULT NULL,
    max_price BIGINT DEFAULT NULL,
    result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    price BIGINT,
    stock INTEGER,
    image_url TEXT,
    category_id UUID,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.category_id,
        ts_rank(p.search_vector, plainto_tsquery('english', search_query)) AS relevance
    FROM products p
    WHERE 
        p.stock > 0
        AND (category_filter IS NULL OR p.category_id = category_filter)
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
        AND (
            search_query IS NULL OR search_query = '' OR
            p.search_vector @@ plainto_tsquery('english', search_query)
        )
    ORDER BY 
        CASE WHEN search_query IS NULL OR search_query = '' 
            THEN 0 
            ELSE ts_rank(p.search_vector, plainto_tsquery('english', search_query))
        END DESC,
        p.created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_products IS 
    'Full-text search products with optional category and price filters';

-- Function to get products by category (including subcategories)
CREATE OR REPLACE FUNCTION get_category_products(
    p_category_id UUID,
    include_subcategories BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    price BIGINT,
    stock INTEGER,
    image_url TEXT
) AS $$
BEGIN
    IF include_subcategories THEN
        -- Include products from this category and all subcategories
        RETURN QUERY
        SELECT 
            p.id,
            p.name,
            p.price,
            p.stock,
            p.image_url
        FROM products p
        WHERE p.stock > 0
          AND p.category_id IN (
              SELECT c.id FROM categories c
              WHERE c.id = p_category_id 
                 OR c.parent_id = p_category_id
          )
        ORDER BY p.created_at DESC;
    ELSE
        -- Only this category
        RETURN QUERY
        SELECT 
            p.id,
            p.name,
            p.price,
            p.stock,
            p.image_url
        FROM products p
        WHERE p.stock > 0
          AND p.category_id = p_category_id
        ORDER BY p.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for product listing with category info
CREATE OR REPLACE VIEW products_with_category AS
SELECT 
    p.id,
    p.shop_id,
    p.name,
    p.description,
    p.image_url,
    p.price,
    p.stock,
    p.created_at,
    c.name AS category_name,
    c.slug AS category_slug,
    c.icon AS category_icon
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.stock > 0
ORDER BY p.created_at DESC;

COMMENT ON VIEW products_with_category IS 
    'Products with category information for display on shop page';

-- View to get category hierarchy with product counts
-- (Moved from categories migration to avoid dependency issues)
CREATE OR REPLACE VIEW categories_with_counts AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.icon,
    c.display_order,
    c.parent_id,
    COUNT(DISTINCT children.id) AS subcategory_count,
    COUNT(DISTINCT p.id) AS product_count
FROM categories c
LEFT JOIN categories children ON children.parent_id = c.id AND children.is_active = TRUE
LEFT JOIN products p ON p.category_id = c.id
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.slug, c.icon, c.display_order, c.parent_id
ORDER BY c.display_order;

COMMENT ON VIEW categories_with_counts IS 
    'Categories with counts of subcategories and products (for navigation menus)';


-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    -- Verify table structure
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products'
    ), 'Products table should exist';
    
    -- Verify indexes created
    ASSERT (
        SELECT COUNT(*) FROM pg_indexes 
        WHERE tablename = 'products'
    ) >= 7, 'Expected at least 7 indexes on products table';
    
    -- Verify search function exists
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'search_products'
    ), 'search_products function should exist';
    
    RAISE NOTICE 'Products table verified successfully';
END $$;
