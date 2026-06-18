-- 20240618000001_schema_consolidation.sql
-- Consolidate schema to final column naming convention

-- Ensure payment_links has correct columns
DO $$ BEGIN
  -- Add link_type if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_links' AND column_name='link_type') THEN
    ALTER TABLE payment_links ADD COLUMN link_type VARCHAR(20) DEFAULT 'invoice';
  END IF;
  
  -- Ensure destination_chain exists (was creator_chain)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_links' AND column_name='creator_chain') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_links' AND column_name='destination_chain') THEN
    ALTER TABLE payment_links RENAME COLUMN creator_chain TO destination_chain;
  END IF;
  
  -- Ensure destination columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_links' AND column_name='creator_address') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_links' AND column_name='merchant_address') THEN
    ALTER TABLE payment_links RENAME COLUMN creator_address TO merchant_address;
  END IF;
  
  -- Add merchant_email alias
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_links' AND column_name='merchant_email') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_links' AND column_name='creator_email') THEN
      ALTER TABLE payment_links RENAME COLUMN creator_email TO merchant_email;
    ELSE
      ALTER TABLE payment_links ADD COLUMN merchant_email VARCHAR(255);
    END IF;
  END IF;
END $$;

-- Ensure transactions has correct columns
DO $$ BEGIN
  -- Rename payer_chain -> source_chain if old name still exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payer_chain') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='source_chain') THEN
    ALTER TABLE transactions RENAME COLUMN payer_chain TO source_chain;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='tx_hash') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='source_tx_hash') THEN
    ALTER TABLE transactions RENAME COLUMN tx_hash TO source_tx_hash;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='token_paid') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='source_token') THEN
    ALTER TABLE transactions RENAME COLUMN token_paid TO source_token;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='amount_paid') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='source_amount') THEN
    ALTER TABLE transactions RENAME COLUMN amount_paid TO source_amount;
  END IF;
  
  -- Add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='destination_tx_hash') THEN
    ALTER TABLE transactions ADD COLUMN destination_tx_hash VARCHAR(128);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='destination_amount') THEN
    ALTER TABLE transactions ADD COLUMN destination_amount DECIMAL(28,18);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='protocol_fee') THEN
    ALTER TABLE transactions ADD COLUMN protocol_fee DECIMAL(28,18) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='lifi_route_id') THEN
    ALTER TABLE transactions ADD COLUMN lifi_route_id VARCHAR(128);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='confirmed_at') THEN
    ALTER TABLE transactions ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update status constraint on transactions to include all valid states
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('pending', 'bridging', 'confirmed', 'failed', 'refunded'));

-- Update status constraint on payment_links
ALTER TABLE payment_links DROP CONSTRAINT IF EXISTS payment_links_status_check;
ALTER TABLE payment_links ADD CONSTRAINT payment_links_status_check 
  CHECK (status IN ('active', 'completed', 'expired', 'cancelled', 'pending', 'bridging', 'partial', 'failed'));
