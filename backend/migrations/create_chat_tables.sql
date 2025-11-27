-- =========================================================
-- CHAT SYSTEM TABLES
-- Real-time messaging between customers and salons
-- =========================================================

USE haircut_dev;

-- 1. CONVERSATIONS TABLE
-- Stores chat conversations between customers and salons
CREATE TABLE IF NOT EXISTS conversations (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  customer_id       BIGINT UNSIGNED NOT NULL,
  salon_id          BIGINT UNSIGNED NOT NULL,
  last_message_at   DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_conv_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_conv_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
    
  -- One conversation per customer-salon pair
  UNIQUE KEY uq_customer_salon (customer_id, salon_id)
) ENGINE=InnoDB;

CREATE INDEX idx_conv_customer ON conversations(customer_id, last_message_at);
CREATE INDEX idx_conv_salon ON conversations(salon_id, last_message_at);

-- 2. MESSAGES TABLE
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id   BIGINT UNSIGNED NOT NULL,
  sender_id         BIGINT UNSIGNED NOT NULL,
  message_text      TEXT NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_msg_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_msg_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_msg_sender ON messages(sender_id);

-- 3. MESSAGE_READS TABLE
-- Tracks which messages have been read by which users
CREATE TABLE IF NOT EXISTS message_reads (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  message_id  BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  read_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_read_message
    FOREIGN KEY (message_id) REFERENCES messages(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_read_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
    
  -- One read record per message-user pair
  UNIQUE KEY uq_message_user (message_id, user_id)
) ENGINE=InnoDB;

CREATE INDEX idx_read_user ON message_reads(user_id, read_at);

-- =========================================================
-- VERIFICATION
-- =========================================================

SELECT 
  'conversations' AS table_name, 
  COUNT(*) AS column_count 
FROM information_schema.columns 
WHERE table_schema = 'haircut_dev' AND table_name = 'conversations'

UNION ALL

SELECT 
  'messages' AS table_name, 
  COUNT(*) AS column_count 
FROM information_schema.columns 
WHERE table_schema = 'haircut_dev' AND table_name = 'messages'

UNION ALL

SELECT 
  'message_reads' AS table_name, 
  COUNT(*) AS column_count 
FROM information_schema.columns 
WHERE table_schema = 'haircut_dev' AND table_name = 'message_reads';

