-- Migration to fix address column lengths for Sui
ALTER TABLE payment_links ALTER COLUMN creator_address TYPE VARCHAR(128);
ALTER TABLE payment_links ALTER COLUMN token_address TYPE VARCHAR(128);

ALTER TABLE transactions ALTER COLUMN payer_address TYPE VARCHAR(128);
