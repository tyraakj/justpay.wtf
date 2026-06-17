-- Migration 003: Sui Support

ALTER TABLE payment_links DROP CONSTRAINT IF EXISTS valid_chain;
ALTER TABLE payment_links ADD CONSTRAINT valid_chain CHECK (creator_chain IN ('ethereum', 'solana', 'sui'));

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS valid_chain_tx;
-- Wait, the constraint on transactions wasn't explicitly named valid_chain_tx, there isn't one on payer_chain in 001. Let's just update the ones that exist.

-- Wait, 002 has valid_chain_family on payout_destinations
ALTER TABLE payout_destinations DROP CONSTRAINT IF EXISTS valid_chain_family;
ALTER TABLE payout_destinations ADD CONSTRAINT valid_chain_family CHECK (chain_family IN ('ethereum', 'solana', 'sui'));
