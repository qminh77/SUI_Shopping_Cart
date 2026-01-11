-- Temporary: Disable RLS for addresses table (FOR DEVELOPMENT ONLY)
-- This allows testing without JWT authentication
-- Re-enable RLS in production with proper JWT setup

ALTER TABLE buyer_addresses DISABLE ROW LEVEL SECURITY;

-- IMPORTANT: This is NOT secure for production
-- All users can see and modify all addresses
-- Only use this for local development/testing
