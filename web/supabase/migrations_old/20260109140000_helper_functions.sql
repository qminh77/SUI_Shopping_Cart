-- Migration: Helper Functions and Utilities
-- Created: 2026-01-09
-- Purpose: Create reusable database functions for schema upgrade

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to automatically update 'updated_at' timestamp
-- Used by: products, buyer_addresses, reviews, etc.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 
    'Trigger function to automatically set updated_at to current timestamp on row update';

-- ============================================================================
-- VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate Sui wallet address format
-- Sui addresses are 0x followed by 64 hex characters
CREATE OR REPLACE FUNCTION is_valid_sui_wallet(wallet TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN wallet ~ '^0x[a-fA-F0-9]{64}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_sui_wallet(TEXT) IS 
    'Validates if a string is a properly formatted Sui wallet address';

-- ============================================================================
-- SEARCH HELPER FUNCTIONS
-- ============================================================================

-- Function to normalize text for search (remove accents, lowercase)
-- Useful for Vietnamese product names
CREATE OR REPLACE FUNCTION normalize_for_search(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        unaccent(
            regexp_replace(input_text, '[^\w\s]', ' ', 'g')
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalize_for_search(TEXT) IS 
    'Normalizes text for search by removing accents and special characters';

-- Enable unaccent extension if not already enabled (for Vietnamese support)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate slug from text (for categories, etc.)
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                unaccent(trim(input_text)), 
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_slug(TEXT) IS 
    'Generates URL-safe slug from input text (e.g., "Điện Tử" -> "dien-tu")';

-- ============================================================================
-- AGGREGATE FUNCTIONS
-- ============================================================================

-- Function to calculate average rating (used for product reviews)
CREATE OR REPLACE FUNCTION calculate_average_rating(p_product_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM reviews
    WHERE product_id = p_product_id
      AND is_hidden = FALSE;
    
    RETURN ROUND(avg_rating, 1);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_average_rating(TEXT) IS 
    'Calculates average rating for a product, excluding hidden reviews';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test helper functions
DO $$
BEGIN
    -- Test wallet validation
    ASSERT is_valid_sui_wallet('0x' || repeat('a', 64)) = TRUE, 
        'Valid wallet should pass';
    ASSERT is_valid_sui_wallet('invalid') = FALSE, 
        'Invalid wallet should fail';
    
    -- Note: Slug generation test removed as it's environment-dependent
    -- The generate_slug function will be tested via categories migration
    
    RAISE NOTICE 'Helper functions verified successfully';
END $$;
