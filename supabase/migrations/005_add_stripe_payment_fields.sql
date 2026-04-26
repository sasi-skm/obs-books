-- OBS Books: Stripe Checkout support for international orders.
--
-- payment_method already exists as text (values: 'promptpay', 'transfer').
-- We start accepting 'stripe' as a third value — no DB constraint to alter,
-- application code controls allowed values.
--
-- Webhooks need fast lookup by stripe_session_id; payment_intent_id is
-- stored for refunds and dashboard linking.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id
  ON orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
