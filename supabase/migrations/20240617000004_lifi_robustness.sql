-- Migration 004: LI.FI Robustness Updates

-- 1. payment_links: Add 'partial' to valid_status
ALTER TABLE payment_links DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE payment_links ADD CONSTRAINT valid_status CHECK (
  status IN ('pending', 'quote_locked', 'source_submitted', 'bridging', 'completed', 'partial', 'failed', 'expired')
);

-- 2. transactions: Add substatus tracking and amount received
ALTER TABLE transactions ADD COLUMN substatus VARCHAR(50);
ALTER TABLE transactions ADD COLUMN substatus_message TEXT;
ALTER TABLE transactions ADD COLUMN amount_received NUMERIC;
