-- =========================================================
-- UPDATE CHAT SYSTEM - SUPPORT ACCOUNT
-- Add support system where customers can chat with support
-- =========================================================

USE haircut_dev;

-- 1. Add support_user_id to conversations (nullable, for support chat)
ALTER TABLE conversations 
ADD COLUMN support_user_id BIGINT UNSIGNED NULL AFTER salon_id,
ADD CONSTRAINT fk_conv_support
  FOREIGN KEY (support_user_id) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

-- 2. Update unique constraint to allow support conversations
-- Drop old constraint
ALTER TABLE conversations 
DROP INDEX uq_customer_salon;

-- Add new constraint that allows either salon OR support conversation
-- (customer_id, salon_id, support_user_id) - at least one of salon_id or support_user_id must be set
ALTER TABLE conversations 
ADD UNIQUE KEY uq_customer_target (customer_id, salon_id, support_user_id);

-- 3. Create support account if not exists
INSERT INTO users(role_id, full_name, email, phone, password_hash, avatar_url, status)
VALUES (1, 'Support Team', 'support@haircut.local', '0900000999', '$2y$10$hashdemo', NULL, 'active')
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

-- 4. Index for support conversations
CREATE INDEX idx_conv_support ON conversations(support_user_id, last_message_at);
