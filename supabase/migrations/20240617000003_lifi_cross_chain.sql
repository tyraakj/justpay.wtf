-- Phase 1: LI.FI Cross-Chain Integration Schema Updates

-- 1. payment_links: Reinterpret columns
-- We are renaming these columns to explicitly denote the DESTINATION side of the transaction
ALTER TABLE payment_links RENAME COLUMN creator_chain TO destination_chain;
ALTER TABLE payment_links RENAME COLUMN token_address TO destination_token_address;
ALTER TABLE payment_links RENAME COLUMN amount TO destination_amount;

-- Update the valid_chain constraint
ALTER TABLE payment_links DROP CONSTRAINT IF EXISTS valid_chain;
-- We allow 'ethereum', 'solana', 'sui' and possibly others in the future.
-- For now, we will loosen this constraint to allow any string, or specifically add the ones LI.FI supports.
-- Since LI.FI supports many chains, it's safer to just remove the constraint or expand it.
-- We will expand it to include common LI.FI chains.
ALTER TABLE payment_links ADD CONSTRAINT valid_chain CHECK (destination_chain IN ('ethereum', 'solana', 'sui', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc'));

-- Add new routing columns
ALTER TABLE payment_links ADD COLUMN route_id VARCHAR(255);
ALTER TABLE payment_links ADD COLUMN quote_expires_at TIMESTAMPTZ;

-- Expand payment_links status enum
-- Drop old constraint
ALTER TABLE payment_links DROP CONSTRAINT IF EXISTS valid_status;

-- Migrate existing 'active' links to 'pending' to match the new flow
UPDATE payment_links SET status = 'pending' WHERE status = 'active';

-- Change default to 'pending'
ALTER TABLE payment_links ALTER COLUMN status SET DEFAULT 'pending';

-- Add new constraint
ALTER TABLE payment_links ADD CONSTRAINT valid_status CHECK (
  status IN ('pending', 'quote_locked', 'source_submitted', 'bridging', 'completed', 'failed', 'expired')
);


-- 2. transactions: Expand for cross-chain routing
-- Rename payer_chain -> source_chain for clarity
ALTER TABLE transactions RENAME COLUMN payer_chain TO source_chain;
ALTER TABLE transactions ALTER COLUMN source_chain TYPE VARCHAR(50); -- increase size just in case

-- Rename tx_hash -> source_tx_hash since there are now two distinct hashes in a cross-chain swap
ALTER TABLE transactions RENAME COLUMN tx_hash TO source_tx_hash;

-- Rename token_paid -> source_token_address
ALTER TABLE transactions RENAME COLUMN token_paid TO source_token_address;
ALTER TABLE transactions ALTER COLUMN source_token_address TYPE VARCHAR(128); -- expand from 10 to 128

-- Add new columns
ALTER TABLE transactions ADD COLUMN dest_tx_hash VARCHAR(128) UNIQUE;
ALTER TABLE transactions ADD COLUMN route_steps JSONB;

-- Change bridge_provider default to 'lifi'
ALTER TABLE transactions ALTER COLUMN bridge_provider SET DEFAULT 'lifi';

-- Update the valid_bridge_status if necessary (LI.FI uses its own status model, but we map it)
-- We will keep the existing constraint or loosen it if we need more bridge statuses.
-- The existing is: ('bridging', 'bridge_complete', 'bridge_failed')
