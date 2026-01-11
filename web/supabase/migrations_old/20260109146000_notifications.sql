-- Migration: Notifications Table
-- Created: 2026-01-09
-- Purpose: In-app notification system

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
    'order_placed',         -- New order for seller
    'order_shipped',        -- Order shipped notification for buyer
    'order_delivered',      -- Order delivered notification for buyer
    'shop_approved',        -- Shop application approved
    'shop_suspended',       -- Shop suspended by admin
    'shop_unsuspended',     -- Shop reactivated
    'stock_low',            -- Product stock running low
    'new_review',           -- New review on seller's product
    'review_response',      -- Seller responded to buyer's review
    'system_announcement'   -- Platform-wide announcements
);

COMMENT ON TYPE notification_type IS 
    'Categories of notifications that can be sent to users';

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    recipient_wallet TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities (for deep linking)
    related_id TEXT,                        -- Order ID, Product ID, Shop ID, etc.
    related_type TEXT,                      -- 'order', 'product', 'shop', etc.
    action_url TEXT,                        -- Deep link URL
    
    -- Display metadata
    icon TEXT,                              -- Icon name or emoji
    priority INTEGER DEFAULT 0,             -- 0=normal, 1=important, 2=critical
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 
    'In-app notifications for users';
COMMENT ON COLUMN notifications.related_id IS 
    'ID of related entity (polymorphic reference)';
COMMENT ON COLUMN notifications.action_url IS 
    'URL to navigate when notification is clicked';
COMMENT ON COLUMN notifications.priority IS 
    '0=normal (info), 1=important (warning), 2=critical (error/urgent)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User's notifications (most common query)
CREATE INDEX idx_notifications_recipient ON notifications(
    recipient_wallet, 
    is_read, 
    created_at DESC
);

-- Unread notifications count query
CREATE INDEX idx_notifications_unread ON notifications(recipient_wallet, is_read)
    WHERE is_read = FALSE;

-- Notification type filtering
CREATE INDEX idx_notifications_type ON notifications(notification_type, created_at DESC);

-- Priority sorting (for critical alerts)
CREATE INDEX idx_notifications_priority ON notifications(recipient_wallet, priority DESC, created_at DESC)
    WHERE is_read = FALSE;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Validate wallet format
ALTER TABLE notifications ADD CONSTRAINT notifications_wallet_check
    CHECK (is_valid_sui_wallet(recipient_wallet));

-- Valid priority range
ALTER TABLE notifications ADD CONSTRAINT notifications_priority_check
    CHECK (priority BETWEEN 0 AND 2);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-set read_at when marked as read
CREATE OR REPLACE FUNCTION set_notification_read_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_read_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    WHEN (NEW.is_read = TRUE AND OLD.is_read = FALSE)
    EXECUTE FUNCTION set_notification_read_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (recipient_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (recipient_wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
    WITH CHECK (recipient_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- System can insert notifications (via service role or triggers)
-- CREATE POLICY "System can insert notifications" ON notifications
--     FOR INSERT
--     WITH CHECK (true);
-- Note: This would be set with service role key, not user JWT

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Create notification helper
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_wallet TEXT,
    p_notification_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_related_id TEXT DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_priority INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    new_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        recipient_wallet,
        notification_type,
        title,
        message,
        related_id,
        related_type,
        action_url,
        priority
    ) VALUES (
        p_recipient_wallet,
        p_notification_type,
        p_title,
        p_message,
        p_related_id,
        p_related_type,
        p_action_url,
        p_priority
    )
    RETURNING id INTO new_notification_id;
    
    RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notification IS 
    'Helper function to create a new notification';

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE recipient_wallet = p_wallet
      AND is_read = FALSE;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = TRUE,
        read_at = NOW()
    WHERE recipient_wallet = p_wallet
      AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Delete old read notifications (cleanup function for cron job)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE is_read = TRUE
      AND read_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_notifications IS 
    'Deletes read notifications older than specified days (default 30)';

-- ============================================================================
-- AUTOMATIC NOTIFICATION TRIGGERS
-- ============================================================================

-- Notify seller when new order is placed
CREATE OR REPLACE FUNCTION notify_seller_new_order()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NEW.seller_wallet,
        'order_placed'::notification_type,
        'New Order Received',
        'You have a new order #' || NEW.id::TEXT,
        NEW.id::TEXT,
        'order',
        '/seller/orders',
        1  -- Important priority
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_notify_seller
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_seller_new_order();

-- Notify buyer when order status changes
CREATE OR REPLACE FUNCTION notify_buyer_order_status()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type_val notification_type;
BEGIN
    -- Only notify on status change
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;
    
    -- Determine notification based on new status
    CASE NEW.status
        WHEN 'shipping' THEN
            notification_type_val := 'order_shipped';
            notification_title := 'Order Shipped';
            notification_message := 'Your order #' || NEW.id::TEXT || ' has been shipped!';
        WHEN 'delivered' THEN
            notification_type_val := 'order_delivered';
            notification_title := 'Order Delivered';
            notification_message := 'Your order #' || NEW.id::TEXT || ' has been delivered!';
        ELSE
            RETURN NEW;
    END CASE;
    
    PERFORM create_notification(
        NEW.buyer_wallet,
        notification_type_val,
        notification_title,
        notification_message,
        NEW.id::TEXT,
        'order',
        '/profile/orders',
        1  -- Important
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_notify_buyer_status
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION notify_buyer_order_status();

-- Notify seller when they receive a new review
CREATE OR REPLACE FUNCTION notify_seller_new_review()
RETURNS TRIGGER AS $$
DECLARE
    product_name TEXT;
    seller_wallet TEXT;
BEGIN
    -- Get product details
    SELECT p.name, p.shop_id INTO product_name, seller_wallet
    FROM products p
    WHERE p.id = NEW.product_id;
    
    IF seller_wallet IS NOT NULL THEN
        PERFORM create_notification(
            seller_wallet,
            'new_review'::notification_type,
            'New Review Received',
            'Your product "' || product_name || '" received a ' || NEW.rating || '-star review',
            NEW.product_id,
            'product',
            '/seller',
            0  -- Normal priority
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_notify_seller
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_seller_new_review();

-- Notify buyer when seller responds to their review
CREATE OR REPLACE FUNCTION notify_buyer_review_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if seller response was just added
    IF NEW.seller_response IS NOT NULL AND OLD.seller_response IS NULL THEN
        PERFORM create_notification(
            NEW.buyer_wallet,
            'review_response'::notification_type,
            'Seller Responded to Your Review',
            'The seller has responded to your review',
            NEW.product_id,
            'product',
            '/profile/orders',
            0  -- Normal priority
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_notify_buyer_response
    AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN (NEW.seller_response IS NOT NULL AND OLD.seller_response IS NULL)
    EXECUTE FUNCTION notify_buyer_review_response();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample system announcement (for testing)
/*
INSERT INTO notifications (
    recipient_wallet,
    notification_type,
    title,
    message,
    priority
) VALUES (
    '0x' || repeat('a', 64),
    'system_announcement',
    'Welcome to the Platform!',
    'Thank you for joining our decentralized marketplace.',
    0
);
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications'
    ), 'Notifications table should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'notification_type'
    ), 'notification_type enum should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_notification'
    ), 'create_notification function should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_unread_notification_count'
    ), 'get_unread_notification_count function should exist';
    
    RAISE NOTICE 'Notifications table verified successfully';
END $$;
