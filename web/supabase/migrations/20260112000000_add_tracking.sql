-- Add tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_code text,
ADD COLUMN IF NOT EXISTS shipping_carrier text;

-- Add comment for documentation
COMMENT ON COLUMN orders.tracking_code IS 'Tracking code provided by the shipping carrier';
COMMENT ON COLUMN orders.shipping_carrier IS 'Name of the shipping carrier (e.g., DHL, FedEx, VNPost)';
