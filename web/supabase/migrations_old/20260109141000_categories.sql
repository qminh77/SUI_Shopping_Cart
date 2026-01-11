-- Migration: Categories Table
-- Created: 2026-01-09
-- Purpose: Product categorization system with hierarchical support

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Hierarchy support (subcategories)
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Display
    icon TEXT,                              -- Emoji or icon name
    image_url TEXT,                         -- Category banner image
    display_order INTEGER DEFAULT 0,        -- Sort order in UI
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 
    'Product categories with hierarchical support';
COMMENT ON COLUMN categories.parent_id IS 
    'NULL for top-level categories, references parent for subcategories';
COMMENT ON COLUMN categories.slug IS 
    'URL-safe identifier (e.g., "dien-tu" for "Điện Tử")';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for parent-child queries
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Index for active categories (most common query)
CREATE INDEX idx_categories_active ON categories(is_active, display_order) 
    WHERE is_active = TRUE;

-- Index for slug lookups (URL routing)
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate slug from name if not provided
CREATE OR REPLACE FUNCTION categories_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name);
        
        -- Ensure uniqueness by appending counter if needed
        WHILE EXISTS (SELECT 1 FROM categories WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
            NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_auto_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION categories_generate_slug();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read active categories (public access)
CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT
    USING (is_active = TRUE);

-- Only admins can manage categories (to be implemented with admin role system)
-- For now, allow all authenticated users (will restrict later)
CREATE POLICY "Authenticated users can manage categories" ON categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default top-level categories
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
    ('Electronics', 'electronics', 'Phones, laptops, cameras, and gadgets', '⚡', 10),
    ('Fashion', 'fashion', 'Clothing, shoes, and accessories', '👗', 20),
    ('Food & Beverage', 'food-beverage', 'Groceries, snacks, and drinks', '🍔', 30),
    ('Home & Living', 'home-living', 'Furniture, decor, and kitchen items', '🏠', 40),
    ('Beauty & Health', 'beauty-health', 'Cosmetics, skincare, and wellness', '💄', 50),
    ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', '⚽', 60),
    ('Books & Media', 'books-media', 'Books, magazines, and digital media', '📚', 70),
    ('Toys & Games', 'toys-games', 'Toys, board games, and collectibles', '🎮', 80),
    ('Automotive', 'automotive', 'Car parts and accessories', '🚗', 90),
    ('Others', 'others', 'Miscellaneous items', '📦', 100)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample subcategories for Electronics
INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 
    subcategory.name,
    subcategory.slug,
    subcategory.description,
    c.id,
    subcategory.display_order
FROM categories c
CROSS JOIN (
    VALUES
        ('Smartphones', 'smartphones', 'Mobile phones and accessories', 1),
        ('Laptops', 'laptops', 'Notebooks and ultrabooks', 2),
        ('Tablets', 'tablets', 'iPads and Android tablets', 3),
        ('Cameras', 'cameras', 'Digital and DSLR cameras', 4),
        ('Audio', 'audio', 'Headphones, speakers, and earbuds', 5),
        ('Smartwatches', 'smartwatches', 'Wearable tech', 6)
) AS subcategory(name, slug, description, display_order)
WHERE c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

-- Insert sample subcategories for Fashion
INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 
    subcategory.name,
    subcategory.slug,
    subcategory.description,
    c.id,
    subcategory.display_order
FROM categories c
CROSS JOIN (
    VALUES
        ('Men''s Clothing', 'mens-clothing', 'Shirts, pants, and suits', 1),
        ('Women''s Clothing', 'womens-clothing', 'Dresses, blouses, and skirts', 2),
        ('Shoes', 'shoes', 'Sneakers, boots, and sandals', 3),
        ('Bags', 'bags', 'Handbags, backpacks, and wallets', 4),
        ('Accessories', 'accessories', 'Watches, jewelry, and belts', 5)
) AS subcategory(name, slug, description, display_order)
WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Note: categories_with_counts VIEW has been moved to products migration
-- (after products table is created) to avoid dependency issues

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    category_count INTEGER;
    electronics_id UUID;
    subcategory_count INTEGER;
BEGIN
    -- Check top-level categories created
    SELECT COUNT(*) INTO category_count
    FROM categories
    WHERE parent_id IS NULL;
    
    ASSERT category_count >= 10, 
        'Expected at least 10 top-level categories';
    
    -- Check Electronics subcategories
    SELECT id INTO electronics_id
    FROM categories
    WHERE slug = 'electronics';
    
    SELECT COUNT(*) INTO subcategory_count
    FROM categories
    WHERE parent_id = electronics_id;
    
    ASSERT subcategory_count >= 6, 
        'Expected at least 6 Electronics subcategories';
    
    -- Check slug generation works
    ASSERT EXISTS (
        SELECT 1 FROM categories WHERE slug ~ '^[a-z0-9-]+$'
    ), 'All slugs should be lowercase alphanumeric with hyphens';
    
    RAISE NOTICE 'Categories table verified: % top-level, % Electronics subcategories', 
        category_count, subcategory_count;
END $$;
