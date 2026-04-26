-- OBS Books: rollback for 005_add_stripe_payment_fields.sql
--
-- Run only if you need to fully unwind Stripe support. Note: this DROPS
-- columns, so any data captured against Stripe orders (session ids,
-- payment intent ids) will be lost. The orders themselves remain intact —
-- payment_method continues to live as a plain text column with values
-- 'promptpay' / 'transfer' / 'stripe'. If you want to also clear the
-- 'stripe' value from existing rows before dropping, run:
--
--   UPDATE orders SET payment_method = 'promptpay' WHERE payment_method = 'stripe';
--
-- (only do this if you're abandoning Stripe entirely — otherwise you'll
-- mislabel real Stripe orders as PromptPay).

DROP INDEX IF EXISTS idx_orders_stripe_payment_intent_id;
DROP INDEX IF EXISTS idx_orders_stripe_session_id;

ALTER TABLE orders
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  DROP COLUMN IF EXISTS stripe_session_id;
