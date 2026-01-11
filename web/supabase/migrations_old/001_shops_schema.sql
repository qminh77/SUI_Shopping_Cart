-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_wallet text NOT NULL,
    shop_name text NOT NULL,
    shop_description text NOT NULL,
    business_type text NOT NULL, -- 'PERSONAL' or 'BUSINESS'
    tax_code text,
    established_year int NOT NULL,
    website text,
    contact_email text NOT NULL,
    contact_phone text NOT NULL,
    address_city text NOT NULL,
    address_detail text NOT NULL,
    logo_url text,
    facebook_url text,
    instagram_url text,
    support_policy text,
    return_policy text,
    warranty_policy text,
    legal_docs_urls jsonb, -- Array of strings
    status text DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'ACTIVE', 'SUSPENDED'
    admin_note text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indices
CREATE UNIQUE INDEX IF NOT EXISTS shops_owner_wallet_idx ON shops(owner_wallet);
CREATE INDEX IF NOT EXISTS shops_status_idx ON shops(status);
CREATE INDEX IF NOT EXISTS shops_tax_code_idx ON shops(tax_code);

-- Create shop_audit_logs table
CREATE TABLE IF NOT EXISTS shop_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
    action text NOT NULL, -- 'APPROVE', 'SUSPEND', 'UNSUSPEND', 'UPDATE_NOTE', 'SELLER_CREATE', 'SELLER_UPDATE'
    from_status text,
    to_status text,
    admin_wallet text NOT NULL, -- Wallet address or 'SELLER'
    note text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS shop_audit_logs_shop_id_idx ON shop_audit_logs(shop_id);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for ACTIVE shops (for marketplace display later)
CREATE POLICY "Public read active shops" ON shops
    FOR SELECT
    USING (status = 'ACTIVE');

-- Policy: Admin/Service Role full access (Supabase Service Role key bypasses RLS, so this is mainly for authenticated users if we use user sessions directly)
-- For now, we rely on Service Role for Admin ops and 'owner_wallet' check for Seller ops in API.

-- Policy: Sellers can view their own shop
CREATE POLICY "Sellers view own shop" ON shops
    FOR SELECT
    USING (owner_wallet = auth.jwt() ->> 'wallet_address'); -- Adjust depending on how auth is handled, likely manual check in API for now.
