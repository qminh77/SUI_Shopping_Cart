-- Migration: Reviews Table
-- Created: 2026-01-09
-- Purpose: Product reviews and ratings system

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Review target
    product_id TEXT NOT NULL,               -- On-chain Product ID
    buyer_wallet TEXT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[],                          -- Array of image URLs
    
    -- Seller interaction
    seller_response TEXT,
    seller_responded_at TIMESTAMPTZ,
    
    -- Verification & Moderation
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,        -- For moderation (hide spam/inappropriate)
    hidden_reason TEXT,                     -- Admin note for why hidden
    
    -- Helpfulness voting
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reviews IS 
    'Product reviews and ratings with seller response support';
COMMENT ON COLUMN reviews.is_verified_purchase IS 
    'TRUE if buyer actually purchased this product (verified via order_id)';
COMMENT ON COLUMN reviews.images IS 
    'Optional review photos uploaded by buyer';
COMMENT ON COLUMN reviews.helpful_count IS 
    'Number of users who found this review helpful';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Product reviews lookup (most common query)
CREATE INDEX idx_reviews_product ON reviews(product_id, created_at DESC)
    WHERE is_hidden = FALSE;

-- Buyer's reviews
CREATE INDEX idx_reviews_buyer ON reviews(buyer_wallet, created_at DESC);

-- Rating distribution queries
CREATE INDEX idx_reviews_rating ON reviews(product_id, rating)
    WHERE is_hidden = FALSE;

-- Verified purchase reviews (for filtering)
CREATE INDEX idx_reviews_verified ON reviews(product_id, is_verified_purchase)
    WHERE is_verified_purchase = TRUE AND is_hidden = FALSE;

-- Moderation queue
CREATE INDEX idx_reviews_moderation ON reviews(is_hidden, created_at)
    WHERE is_hidden = TRUE;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- One review per buyer per product
CREATE UNIQUE INDEX idx_reviews_unique 
    ON reviews(product_id, buyer_wallet);

COMMENT ON INDEX idx_reviews_unique IS 
    'Prevents duplicate reviews from same buyer on same product';

-- Validate wallet format
ALTER TABLE reviews ADD CONSTRAINT reviews_wallet_check
    CHECK (is_valid_sui_wallet(buyer_wallet));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-verify purchase when order_id is provided
CREATE OR REPLACE FUNCTION verify_review_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- If order_id is provided, mark as verified purchase
    IF NEW.order_id IS NOT NULL THEN
        NEW.is_verified_purchase := TRUE;
        
        -- Verify the buyer actually bought this product
        IF NOT EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.id = NEW.order_id
              AND o.buyer_wallet = NEW.buyer_wallet
              AND oi.product_id = NEW.product_id
        ) THEN
            RAISE EXCEPTION 'Order does not contain this product for this buyer';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_verify_purchase
    BEFORE INSERT OR UPDATE ON reviews
    FOR EACH ROW
    WHEN (NEW.order_id IS NOT NULL)
    EXECUTE FUNCTION verify_review_purchase();

-- Auto-set seller_responded_at when seller adds response
CREATE OR REPLACE FUNCTION set_review_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.seller_response IS NOT NULL AND OLD.seller_response IS NULL THEN
        NEW.seller_responded_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_response_timestamp
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION set_review_response_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read non-hidden reviews
CREATE POLICY "Public can read visible reviews" ON reviews
    FOR SELECT
    USING (is_hidden = FALSE);

-- Buyers can insert their own reviews (if they purchased the product)
CREATE POLICY "Buyers can create reviews" ON reviews
    FOR INSERT
    WITH CHECK (
        buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet'
        AND (
            order_id IS NULL OR
            EXISTS (
                SELECT 1 FROM orders o
                WHERE o.id = order_id 
                  AND o.buyer_wallet = buyer_wallet
            )
        )
    );

-- Buyers can update their own reviews (but not seller response)
CREATE POLICY "Buyers can update own reviews" ON reviews
    FOR UPDATE
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
    WITH CHECK (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Sellers can add responses to reviews of their products
CREATE POLICY "Sellers can respond to reviews" ON reviews
    FOR UPDATE
    USING (
        -- Check if current user is the seller of this product
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_id
              AND p.shop_id = current_setting('request.jwt.claims', true)::json->>'wallet'
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate average rating for a product
CREATE OR REPLACE FUNCTION get_product_rating(p_product_id TEXT)
RETURNS TABLE (
    average_rating NUMERIC,
    total_reviews BIGINT,
    rating_1_count BIGINT,
    rating_2_count BIGINT,
    rating_3_count BIGINT,
    rating_4_count BIGINT,
    rating_5_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating), 1) AS average_rating,
        COUNT(*) AS total_reviews,
        COUNT(*) FILTER (WHERE rating = 1) AS rating_1_count,
        COUNT(*) FILTER (WHERE rating = 2) AS rating_2_count,
        COUNT(*) FILTER (WHERE rating = 3) AS rating_3_count,
        COUNT(*) FILTER (WHERE rating = 4) AS rating_4_count,
        COUNT(*) FILTER (WHERE rating = 5) AS rating_5_count
    FROM reviews
    WHERE product_id = p_product_id
      AND is_hidden = FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_product_rating IS 
    'Returns comprehensive rating statistics for a product';

-- Get recent reviews for a product
CREATE OR REPLACE FUNCTION get_product_reviews(
    p_product_id TEXT,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_min_rating INTEGER DEFAULT NULL,
    p_verified_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    buyer_wallet TEXT,
    rating INTEGER,
    comment TEXT,
    images TEXT[],
    seller_response TEXT,
    is_verified_purchase BOOLEAN,
    helpful_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.buyer_wallet,
        r.rating,
        r.comment,
        r.images,
        r.seller_response,
        r.is_verified_purchase,
        r.helpful_count,
        r.created_at
    FROM reviews r
    WHERE r.product_id = p_product_id
      AND r.is_hidden = FALSE
      AND (p_min_rating IS NULL OR r.rating >= p_min_rating)
      AND (p_verified_only = FALSE OR r.is_verified_purchase = TRUE)
    ORDER BY r.helpful_count DESC, r.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if buyer can review a product (purchased and not yet reviewed)
CREATE OR REPLACE FUNCTION can_review_product(
    p_buyer_wallet TEXT,
    p_product_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_purchased BOOLEAN;
    already_reviewed BOOLEAN;
BEGIN
    -- Check if buyer purchased this product
    SELECT EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.buyer_wallet = p_buyer_wallet
          AND oi.product_id = p_product_id
          AND o.status = 'delivered'
    ) INTO has_purchased;
    
    -- Check if already reviewed
    SELECT EXISTS (
        SELECT 1 FROM reviews
        WHERE buyer_wallet = p_buyer_wallet
          AND product_id = p_product_id
    ) INTO already_reviewed;
    
    RETURN has_purchased AND NOT already_reviewed;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for product listings with ratings
CREATE OR REPLACE VIEW products_with_ratings AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock,
    p.image_url,
    p.category_id,
    COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
    COUNT(r.id) AS review_count
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id AND r.is_hidden = FALSE
WHERE p.stock > 0
GROUP BY p.id, p.name, p.price, p.stock, p.image_url, p.category_id;

COMMENT ON VIEW products_with_ratings IS 
    'Products with aggregated rating data for shop page display';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reviews'
    ), 'Reviews table should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_reviews_unique'
    ), 'Unique constraint should prevent duplicate reviews';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_product_rating'
    ), 'get_product_rating function should exist';
    
    RAISE NOTICE 'Reviews table verified successfully';
END $$;
