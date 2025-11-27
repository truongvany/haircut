-- Migration: Add bank_transfer to payment methods
-- Date: 2025-11-12

USE haircut_dev;

-- Update payments table to include bank_transfer method
ALTER TABLE payments 
MODIFY method ENUM('cash','bank_transfer','vn_pay','momo') NOT NULL;

-- Verify the change
DESCRIBE payments;

