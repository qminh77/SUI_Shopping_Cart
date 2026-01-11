-- Migration: Vouchers Table
-- Created: 2026-01-09
-- Purpose: Discount codes and promotional vouchers system

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE voucher_type AS ENUM (
    'percentage',           -- % discount (e.g., 10% off)
    'fixed_amount',         -- Fixed SUI amount off (e.g., 5 SUI off)
    'free_shipping'         -- Free shipping (future use)
);

COMMENT ON TYPE voucher_type IS 
    'Types of discounts that can be applied via vouchers';

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Voucher identification
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,                     -- Display name (e.g., "New Year Sale")
    description TEXT,
    
    -- Discount configuration
    voucher_type voucher_type NOT NULL,
    discount_value BIGINT NOT NULL,  -- Validation added via ALTER TABLE below
    
    -- For percentage: 0-100 (e.g., 20 = 20% off)
    -- For fixed_amount: amount in MIST (e.g., 5000000000 = 5 SUI)
    max_discount_amount BIGINT,             -- Cap for percentage vouchers (in MIST)
    min_order_amount BIGINT DEFAULT 0,      -- Minimum spend requirement (in MIST)
    
    -- Scope restrictions
    shop_id TEXT,                           -- NULL = marketplace-wide, else specific shop
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Usage limits
    usage_limit INTEGER,                    -- Total times this code can be used (NULL = unlimited)
    usage_count INTEGER DEFAULT 0,          -- Current usage count
    per_user_limit INTEGER DEFAULT 1,       -- Max uses per user
    
    -- Validity period
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_by TEXT,                        -- Admin/Shop owner who created it
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vouchers IS 
    'Promotional discount codes with flexible configuration';
COMMENT ON COLUMN vouchers.code IS 
    'User-facing voucher code (e.g., "NEWYEAR2026")';
COMMENT ON COLUMN vouchers.discount_value IS 
    'Discount amount - interpretation depends on voucher_type';
COMMENT ON COLUMN vouchers.shop_id IS 
    'If set, voucher only applies to products from this shop';

-- ============================================================================
-- VOUCHER USAGE TRACKING
-- ============================================================================

CREATE TABLE voucher_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    buyer_wallet TEXT NOT NULL,
    
    -- Discount applied
    discount_applied BIGINT NOT NULL,       -- Actual discount amount in MIST
    
    used_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE voucher_usage IS 
    'Tracks individual voucher usage for analytics and enforcement';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Voucher code lookup (most common query at checkout)
CREATE UNIQUE INDEX idx_vouchers_code_lower ON vouchers(LOWER(code));

COMMENT ON INDEX idx_vouchers_code_lower IS 
    'Case-insensitive unique code lookup';

-- Shop-specific vouchers
CREATE INDEX idx_vouchers_shop ON vouchers(shop_id) 
    WHERE is_active = TRUE;

-- Active vouchers (for listing available promotions)
CREATE INDEX idx_vouchers_active ON vouchers(is_active, starts_at, expires_at)
    WHERE is_active = TRUE;

-- Category-specific vouchers
CREATE INDEX idx_vouchers_category ON vouchers(category_id)
    WHERE category_id IS NOT NULL;

-- Voucher usage by buyer
CREATE INDEX idx_voucher_usage_buyer ON voucher_usage(buyer_wallet, voucher_id);

-- Voucher usage by voucher (for analytics)
CREATE INDEX idx_voucher_usage_voucher ON voucher_usage(voucher_id, used_at DESC);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Validate discount_value based on type
ALTER TABLE vouchers ADD CONSTRAINT vouchers_discount_value_check
    CHECK (
        (voucher_type = 'percentage' AND discount_value BETWEEN 1 AND 100) OR
        (voucher_type = 'fixed_amount' AND discount_value > 0) OR
        (voucher_type = 'free_shipping')
    );

-- Valid date range
ALTER TABLE vouchers ADD CONSTRAINT vouchers_date_range_check
    CHECK (starts_at < expires_at);

-- Validate wallet format for shop_id
ALTER TABLE vouchers ADD CONSTRAINT vouchers_shop_wallet_check
    CHECK (shop_id IS NULL OR is_valid_sui_wallet(shop_id));

-- Validate buyer wallet in usage
ALTER TABLE voucher_usage ADD CONSTRAINT voucher_usage_wallet_check
    CHECK (is_valid_sui_wallet(buyer_wallet));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER vouchers_updated_at
    BEFORE UPDATE ON vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-normalize voucher code to uppercase
CREATE OR REPLACE FUNCTION normalize_voucher_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.code := UPPER(TRIM(NEW.code));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vouchers_normalize_code
    BEFORE INSERT OR UPDATE ON vouchers
    FOR EACH ROW
    EXECUTE FUNCTION normalize_voucher_code();

-- Auto-increment usage_count when voucher is used
CREATE OR REPLACE FUNCTION increment_voucher_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vouchers
    SET usage_count = usage_count + 1
    WHERE id = NEW.voucher_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voucher_usage_increment
    AFTER INSERT ON voucher_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_voucher_usage();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usage ENABLE ROW LEVEL SECURITY;

-- Public can view active, valid vouchers
CREATE POLICY "Public can view active vouchers" ON vouchers
    FOR SELECT
    USING (
        is_active = TRUE 
        AND NOW() BETWEEN starts_at AND expires_at
    );

-- Shop owners can manage their vouchers
CREATE POLICY "Owners can manage shop vouchers" ON vouchers
    FOR ALL
    USING (
        shop_id = current_setting('request.jwt.claims', true)::json->>'wallet'
        OR created_by = current_setting('request.jwt.claims', true)::json->>'wallet'
    );

-- Buyers can view their own usage history
CREATE POLICY "Buyers can view own usage" ON voucher_usage
    FOR SELECT
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Validate voucher and calculate discount
CREATE OR REPLACE FUNCTION validate_and_calculate_voucher(
    p_voucher_code TEXT,
    p_buyer_wallet TEXT,
    p_order_total BIGINT,
    p_shop_id TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    discount_amount BIGINT,
    error_message TEXT
) AS $$
DECLARE
    v_voucher vouchers;
    v_user_usage_count INTEGER;
    v_calculated_discount BIGINT;
BEGIN
    -- Find voucher (case-insensitive)
    SELECT * INTO v_voucher
    FROM vouchers
    WHERE LOWER(code) = LOWER(p_voucher_code)
    LIMIT 1;
    
    -- Voucher not found
    IF v_voucher IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 'Voucher code not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if active
    IF v_voucher.is_active = FALSE THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 'Voucher is inactive'::TEXT;
        RETURN;
    END IF;
    
    -- Check validity period
    IF NOW() < v_voucher.starts_at THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 'Voucher not yet valid'::TEXT;
        RETURN;
    END IF;
    
    IF NOW() > v_voucher.expires_at THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 'Voucher has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check total usage limit
    IF v_voucher.usage_limit IS NOT NULL AND v_voucher.usage_count >= v_voucher.usage_limit THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 'Voucher usage limit reached'::TEXT;
        RETURN;
    END IF;
    
    -- Check per-user usage limit
    SELECT COUNT(*) INTO v_user_usage_count
    FROM voucher_usage
    WHERE voucher_id = v_voucher.id
      AND buyer_wallet = p_buyer_wallet;
    
    IF v_user_usage_count >= v_voucher.per_user_limit THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 'You have already used this voucher'::TEXT;
        RETURN;
    END IF;
    
    -- Check minimum order amount
    IF p_order_total < v_voucher.min_order_amount THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 
            'Order total does not meet minimum requirement'::TEXT;
        RETURN;
    END IF;
    
    -- Check shop restriction
    IF v_voucher.shop_id IS NOT NULL AND v_voucher.shop_id != p_shop_id THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 
            'Voucher only valid for specific shop'::TEXT;
        RETURN;
    END IF;
    
    -- Check category restriction
    IF v_voucher.category_id IS NOT NULL AND v_voucher.category_id != p_category_id THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 
            'Voucher only valid for specific category'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate discount
    IF v_voucher.voucher_type = 'percentage' THEN
        v_calculated_discount := (p_order_total * v_voucher.discount_value) / 100;
        
        -- Apply max discount cap if set
        IF v_voucher.max_discount_amount IS NOT NULL THEN
            v_calculated_discount := LEAST(v_calculated_discount, v_voucher.max_discount_amount);
        END IF;
    ELSIF v_voucher.voucher_type = 'fixed_amount' THEN
        v_calculated_discount := LEAST(v_voucher.discount_value, p_order_total);
    ELSE
        v_calculated_discount := 0; -- Free shipping calculated elsewhere
    END IF;
    
    RETURN QUERY SELECT TRUE, v_calculated_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validate_and_calculate_voucher IS 
    'Validates voucher and returns calculated discount or error message';

-- Get active vouchers for a shop
CREATE OR REPLACE FUNCTION get_active_shop_vouchers(p_shop_id TEXT)
RETURNS TABLE (
    code TEXT,
    name TEXT,
    description TEXT,
    voucher_type voucher_type,
    discount_value BIGINT,
    min_order_amount BIGINT,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.code,
        v.name,
        v.description,
        v.voucher_type,
        v.discount_value,
        v.min_order_amount,
        v.expires_at
    FROM vouchers v
    WHERE v.is_active = TRUE
      AND NOW() BETWEEN v.starts_at AND v.expires_at
      AND (v.shop_id IS NULL OR v.shop_id = p_shop_id)
      AND (v.usage_limit IS NULL OR v.usage_count < v.usage_limit)
    ORDER BY v.discount_value DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample vouchers (for testing)
INSERT INTO vouchers (
    code, name, description, voucher_type, discount_value, 
    min_order_amount, starts_at, expires_at
) VALUES
    (
         'WELCOME10',
        'Welcome Discount',
        '10% off your first order',
        'percentage',
        10,
        0,
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '30 days'
    ),
    (
        'SAVE5SUI',
        '5 SUI Off',
        '5 SUI discount on orders above 50 SUI',
        'fixed_amount',
        5000000000,  -- 5 SUI in MIST
        50000000000, -- 50 SUI minimum
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '7 days'
    )
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    voucher_count INTEGER;
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vouchers'
    ), 'Vouchers table should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'voucher_type'
    ), 'voucher_type enum should exist';
    
    SELECT COUNT(*) INTO voucher_count FROM vouchers;
    ASSERT voucher_count >= 2, 'Sample vouchers should be created';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'validate_and_calculate_voucher'
    ), 'validate_and_calculate_voucher function should exist';
    
    RAISE NOTICE 'Vouchers table verified: % sample vouchers created', voucher_count;
END $$;
