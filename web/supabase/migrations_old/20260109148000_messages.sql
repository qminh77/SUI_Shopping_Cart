-- Migration: Messages Table
-- Created: 2026-01-09
-- Purpose: Buyer-Seller chat/messaging system

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants
    sender_wallet TEXT NOT NULL,
    recipient_wallet TEXT NOT NULL,
    
    -- Context (optional - what product they're discussing)
    product_id TEXT,
    
    -- Message content
    content TEXT NOT NULL,
    attachments TEXT[],                     -- Array of attachment URLs (images, files)
    
    -- Read status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE messages IS 
    'Direct messages between buyers and sellers';
COMMENT ON COLUMN messages.product_id IS 
    'Optional product context - what product is being discussed';
COMMENT ON COLUMN messages.attachments IS 
    'Array of URLs to attached images or files';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Conversation history query (most common)
-- Shows all messages between two users, sorted by time
CREATE INDEX idx_messages_conversation ON messages(
    sender_wallet, 
    recipient_wallet, 
    created_at DESC
);

-- Also need reverse index for bidirectional queries
CREATE INDEX idx_messages_conversation_reverse ON messages(
    recipient_wallet,
    sender_wallet,
    created_at DESC
);

-- Unread messages for a recipient
CREATE INDEX idx_messages_unread ON messages(recipient_wallet, is_read, created_at DESC)
    WHERE is_read = FALSE;

-- Product-related messages (for product Q&A page)
CREATE INDEX idx_messages_product ON messages(product_id, created_at DESC)
    WHERE product_id IS NOT NULL;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Validate wallet formats
ALTER TABLE messages ADD CONSTRAINT messages_sender_wallet_check
    CHECK (is_valid_sui_wallet(sender_wallet));

ALTER TABLE messages ADD CONSTRAINT messages_recipient_wallet_check
    CHECK (is_valid_sui_wallet(recipient_wallet));

-- Can't send messages to yourself
ALTER TABLE messages ADD CONSTRAINT messages_no_self_message_check
    CHECK (sender_wallet != recipient_wallet);

-- Content must not be empty
ALTER TABLE messages ADD CONSTRAINT messages_content_not_empty_check
    CHECK (LENGTH(TRIM(content)) > 0);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-set read_at when marked as read
CREATE OR REPLACE FUNCTION set_message_read_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_read_timestamp
    BEFORE UPDATE ON messages
    FOR EACH ROW
    WHEN (NEW.is_read = TRUE AND OLD.is_read = FALSE)
    EXECUTE FUNCTION set_message_read_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT
    USING (
        sender_wallet = current_setting('request.jwt.claims', true)::json->>'wallet'
        OR recipient_wallet = current_setting('request.jwt.claims', true)::json->>'wallet'
    );

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    WITH CHECK (sender_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Users can update messages they received (mark as read)
CREATE POLICY "Recipients can update messages" ON messages
    FOR UPDATE
    USING (recipient_wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
    WITH CHECK (recipient_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Users can delete their own sent messages
CREATE POLICY "Senders can delete messages" ON messages
    FOR DELETE
    USING (sender_wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get conversation between two users
CREATE OR REPLACE FUNCTION get_conversation(
    p_user1_wallet TEXT,
    p_user2_wallet TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    sender_wallet TEXT,
    recipient_wallet TEXT,
    content TEXT,
    attachments TEXT[],
    is_read BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_wallet,
        m.recipient_wallet,
        m.content,
        m.attachments,
        m.is_read,
        m.created_at
    FROM messages m
    WHERE 
        (m.sender_wallet = p_user1_wallet AND m.recipient_wallet = p_user2_wallet)
        OR (m.sender_wallet = p_user2_wallet AND m.recipient_wallet = p_user1_wallet)
    ORDER BY m.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_conversation IS 
    'Returns all messages between two users, ordered chronologically';

-- Get list of conversations for a user (inbox)
CREATE OR REPLACE FUNCTION get_conversation_list(p_wallet TEXT)
RETURNS TABLE (
    other_user_wallet TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH all_conversations AS (
        SELECT 
            CASE 
                WHEN sender_wallet = p_wallet THEN recipient_wallet
                ELSE sender_wallet
            END AS other_user,
            content AS last_msg,
            created_at AS msg_time,
            CASE WHEN recipient_wallet = p_wallet AND is_read = FALSE THEN 1 ELSE 0 END AS is_unread
        FROM messages
        WHERE sender_wallet = p_wallet OR recipient_wallet = p_wallet
    ),
    latest_messages AS (
        SELECT DISTINCT ON (other_user)
            other_user,
            last_msg,
            msg_time,
            is_unread
        FROM all_conversations
        ORDER BY other_user, msg_time DESC
    )
    SELECT 
        lm.other_user,
        lm.last_msg,
        lm.msg_time,
        (
            SELECT COUNT(*)
            FROM messages m
            WHERE m.recipient_wallet = p_wallet
              AND (m.sender_wallet = lm.other_user)
              AND m.is_read = FALSE
        ) AS unread_count
    FROM latest_messages lm
    ORDER BY lm.msg_time DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_conversation_list IS 
    'Returns list of conversations with last message and unread count (inbox view)';

-- Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE recipient_wallet = p_wallet
      AND is_read = FALSE;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
    p_recipient_wallet TEXT,
    p_sender_wallet TEXT
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE messages
    SET is_read = TRUE,
        read_at = NOW()
    WHERE recipient_wallet = p_recipient_wallet
      AND sender_wallet = p_sender_wallet
      AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_conversation_read IS 
    'Marks all messages from a specific sender to recipient as read';

-- Send message helper
CREATE OR REPLACE FUNCTION send_message(
    p_sender_wallet TEXT,
    p_recipient_wallet TEXT,
    p_content TEXT,
    p_product_id TEXT DEFAULT NULL,
    p_attachments TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_message_id UUID;
BEGIN
    INSERT INTO messages (
        sender_wallet,
        recipient_wallet,
        content,
        product_id,
        attachments
    ) VALUES (
        p_sender_wallet,
        p_recipient_wallet,
        p_content,
        p_product_id,
        p_attachments
    )
    RETURNING id INTO new_message_id;
    
    RETURN new_message_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Recent messages (for admin monitoring or analytics)
CREATE OR REPLACE VIEW recent_messages AS
SELECT 
    m.id,
    m.sender_wallet,
    m.recipient_wallet,
    m.content,
    m.product_id,
    m.created_at,
    p.name AS product_name
FROM messages m
LEFT JOIN products p ON m.product_id = p.id
ORDER BY m.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_messages IS 
    '100 most recent messages across platform (for admin monitoring)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'messages'
    ), 'Messages table should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_no_self_message_check'
    ), 'Constraint preventing self-messaging should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_conversation'
    ), 'get_conversation function should exist';
    
    ASSERT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_conversation_list'
    ), 'get_conversation_list function should exist';
    
    RAISE NOTICE '✅ Messages table verified successfully - SCHEMA UPGRADE COMPLETE!';
END $$;
