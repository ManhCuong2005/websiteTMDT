ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders
    ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('COD', 'ETH'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments
    ADD CONSTRAINT payments_method_check
    CHECK (method IN ('COD', 'ETH'));

ALTER TABLE payments
    ADD COLUMN blockchain_order_id VARCHAR(66),
    ADD COLUMN expected_amount_wei VARCHAR(78),
    ADD COLUMN payer_wallet_address VARCHAR(42),
    ADD COLUMN chain_id BIGINT,
    ADD COLUMN block_number BIGINT;

CREATE UNIQUE INDEX uk_payments_transaction_reference
    ON payments (lower(transaction_reference))
    WHERE transaction_reference IS NOT NULL;

CREATE UNIQUE INDEX uk_payments_blockchain_order_id
    ON payments (lower(blockchain_order_id))
    WHERE blockchain_order_id IS NOT NULL;
