-- Migration: Buyer Addresses Table
-- Created: 2026-01-09
-- Purpose: Shipping address management for buyers

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE buyer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_wallet TEXT NOT NULL,
    
    -- Recipient information
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Address details
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state_province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Vietnam',
    
    -- Address metadata
    label TEXT,                             -- e.g., "Home", "Office", "Parent's House"
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE buyer_addresses IS 
    'Shipping address book for buyers';
COMMENT ON COLUMN buyer_addresses.buyer_wallet IS 
    'Sui wallet address of the buyer who owns this address';
COMMENT ON COLUMN buyer_addresses.is_default IS 
    'Whether this is the default shipping address (only one per buyer)';
COMMENT ON COLUMN buyer_addresses.label IS 
    'User-friendly label to identify this address';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Buyer's addresses lookup
CREATE INDEX idx_addresses_buyer ON buyer_addresses(buyer_wallet, created_at DESC);

-- Default address quick lookup
CREATE INDEX idx_addresses_default ON buyer_addresses(buyer_wallet) 
    WHERE is_default = TRUE;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure only one default address per buyer
CREATE UNIQUE INDEX idx_addresses_one_default 
    ON buyer_addresses(buyer_wallet) 
    WHERE is_default = TRUE;

COMMENT ON INDEX idx_addresses_one_default IS 
    'Ensures each buyer can have only one default address';

-- Validate phone number format (basic check)
ALTER TABLE buyer_addresses ADD CONSTRAINT phone_format_check 
    CHECK (phone ~ '^[0-9\s\-\+\(\)]+$' AND length(phone) >= 10);

-- Validate wallet format (Sui address)
ALTER TABLE buyer_addresses ADD CONSTRAINT wallet_format_check
    CHECK (is_valid_sui_wallet(buyer_wallet));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER addresses_updated_at
    BEFORE UPDATE ON buyer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default address per buyer
CREATE OR REPLACE FUNCTION enforce_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this address as default
    IF NEW.is_default = TRUE THEN
        -- Unset all other default addresses for this buyer
        UPDATE buyer_addresses 
        SET is_default = FALSE 
        WHERE buyer_wallet = NEW.buyer_wallet 
          AND id != NEW.id
          AND is_default = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER addresses_enforce_single_default
    BEFORE INSERT OR UPDATE ON buyer_addresses
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION enforce_single_default_address();

-- Auto-set first address as default
CREATE OR REPLACE FUNCTION set_first_address_as_default()
RETURNS TRIGGER AS $$
DECLARE
    address_count INTEGER;
BEGIN
    -- Count existing addresses for this buyer
    SELECT COUNT(*) INTO address_count
    FROM buyer_addresses
    WHERE buyer_wallet = NEW.buyer_wallet;
    
    -- If this is the first address, set it as default
    IF address_count = 0 THEN
        NEW.is_default := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER addresses_set_first_default
    BEFORE INSERT ON buyer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION set_first_address_as_default();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE buyer_addresses ENABLE ROW LEVEL SECURITY;

-- Buyers can only view their own addresses
CREATE POLICY "Buyers can view own addresses" ON buyer_addresses
    FOR SELECT
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Buyers can insert their own addresses
CREATE POLICY "Buyers can create own addresses" ON buyer_addresses
    FOR INSERT
    WITH CHECK (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Buyers can update their own addresses
CREATE POLICY "Buyers can update own addresses" ON buyer_addresses
    FOR UPDATE
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
    WITH CHECK (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Buyers can delete their own addresses
CREATE POLICY "Buyers can delete own addresses" ON buyer_addresses
    FOR DELETE
    USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get default address for a buyer
CREATE OR REPLACE FUNCTION get_default_address(p_buyer_wallet TEXT)
RETURNS buyer_addresses AS $$
DECLARE
    result buyer_addresses;
BEGIN
    SELECT * INTO result
    FROM buyer_addresses
    WHERE buyer_wallet = p_buyer_wallet
      AND is_default = TRUE
    LIMIT 1;
    
    -- If no default, return the most recently created
    IF result IS NULL THEN
        SELECT * INTO result
        FROM buyer_addresses
        WHERE buyer_wallet = p_buyer_wallet
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_default_address IS 
    'Returns the default address for a buyer, or most recent if no default set';

-- Format address for display
CREATE OR REPLACE FUNCTION format_address(p_address_id UUID)
RETURNS TEXT AS $$
DECLARE
    addr buyer_addresses;
    formatted TEXT;
BEGIN
    SELECT * INTO addr FROM buyer_addresses WHERE id = p_address_id;
    
    IF addr IS NULL THEN
        RETURN NULL;
    END IF;
    
    formatted := addr.full_name || E'\n' ||
                 addr.phone || E'\n' ||
                 addr.address_line1;
    
    IF addr.address_line2 IS NOT NULL AND addr.address_line2 != '' THEN
        formatted := formatted || E'\n' || addr.address_line2;
    END IF;
    
    formatted := formatted || E'\n' || 
                 addr.city;
    
    IF addr.state_province IS NOT NULL THEN
        formatted := formatted || ', ' || addr.state_province;
    END IF;
    
    IF addr.postal_code IS NOT NULL THEN
        formatted := formatted || ' ' || addr.postal_code;
    END IF;
    
    formatted := formatted || E'\n' || addr.country;
    
    RETURN formatted;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION format_address IS 
    'Returns a formatted multi-line address string suitable for shipping labels';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample addresses (will be removed in production)
-- Uncomment below for local testing only
/*
INSERT INTO buyer_addresses (
    buyer_wallet, 
    full_name, 
    phone, 
    address_line1, 
    city, 
    label, 
    is_default
) VALUES
    (
        '0x' || repeat('a', 64),
        'Nguyễn Văn A',
        '0123456789',
        '123 Lê Lợi',
        'TP. Hồ Chí Minh',
        'Home',
        TRUE
    ),
    (
        '0x' || repeat('a', 64),
        'Nguyễn Văn A',
        '0987654321',
        '456 Nguyễn Huệ',
        'Hà Nội',
        'Office',
        FALSE
    );
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    -- Verify table exists
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'buyer_addresses'
    ), 'buyer_addresses table should exist';
    
    -- Verify unique constraint on default address
    ASSERT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_addresses_one_default'
    ), 'Unique constraint on default address should exist';
    
    -- Verify helper functions
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_default_address'
    ), 'get_default_address function should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'format_address'
    ), 'format_address function should exist';
    
    RAISE NOTICE 'Buyer addresses table verified successfully';
END $$;
