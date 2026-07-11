-- ============================================================
-- Harden orders / order_items RLS
--
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- against the OBS Books project, then re-run the verification
-- block at the bottom to confirm.
--
-- WHY
-- ---
-- supabase/fix-rls-security.sql granted authenticated customers
-- FOR UPDATE on their own orders row with no WITH CHECK clause and
-- no column restriction. Postgres RLS has no column-level scope, so
-- "update your own order" in practice means a customer holding the
-- public anon key plus their own JWT can PATCH the row directly and
-- set payment_status='confirmed', order_status='shipped', or
-- total_amount=1 on any order whose customer_email matches their
-- JWT email. Because /api/orders accepts an arbitrary customer_email,
-- an attacker could also mint orders "owned" by their own address and
-- then mutate them at will.
--
-- Almost every legitimate write already goes through a server route using the
-- service-role key, which bypasses RLS entirely:
--   - app/api/orders/route.ts          (create)
--   - app/api/checkout/stripe/route.ts (create)
--   - app/api/upload-slip/route.ts     (attach slip, set payment_status)
--   - app/api/webhooks/stripe/route.ts (mark paid / expire)
--   - app/admin/**                     (status, tracking, cancel)
-- Reads (orders_user_read_own) stay, which is what /account and /track need.
--
-- ORDERING REQUIREMENT - read this before running the file
-- --------------------------------------------------------
-- An earlier draft of this file claimed customers never write to orders. That
-- was wrong. app/signup/page.tsx linked a new account to its guest orders from
-- the browser with the anon key, relying on the very policy dropped below. RLS
-- would have filtered that UPDATE to zero rows, raised no error, and the empty
-- catch would have swallowed it: every new account would silently lose its
-- order history and the loyalty points hanging off it.
--
-- That path now lives in app/api/link-guest-orders/route.ts (service-role, with
-- the email taken from the verified session rather than the request). Therefore:
--
--   1. Deploy the code containing app/api/link-guest-orders/route.ts.
--   2. THEN run this SQL.
--
-- Running it against a deployment that still has the old client-side signup
-- breaks guest-order linking silently.
-- ============================================================

-- 1. Customers may no longer write to their own order rows.
DROP POLICY IF EXISTS "orders_user_update_own" ON orders;

-- 2. Inserts come from the service-role server routes, never from a
--    browser holding the anon key. `WITH CHECK (true)` let anyone POST
--    an arbitrary order row straight to PostgREST, bypassing the
--    server-side price recalculation in app/api/orders/route.ts.
DROP POLICY IF EXISTS "orders_user_insert" ON orders;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;

-- Note: no replacement INSERT policy is created. With RLS enabled and
-- no permissive INSERT policy, anon/authenticated cannot insert, while
-- service_role continues to bypass RLS. Admin access is unaffected
-- (orders_admin_all / order_items_admin_all use is_admin()).

-- ============================================================
-- VERIFY - run this after applying, and paste the output back.
-- Expect: NO row with cmd='UPDATE' or cmd='INSERT' for roles
-- {public}/{authenticated} on orders or order_items. The
-- *_admin_all (ALL) and *_user_read* (SELECT) rows should remain.
-- ============================================================
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd, policyname;
