-- ============================================================
-- OBS Books - Enable Row Level Security on ALL tables
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' IN (
      'sasiwimolskm@gmail.com',
      'sasiwimolkaewkamol@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 1. BOOKS - public read, admin write
-- ============================================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_public_read" ON books;
CREATE POLICY "books_public_read" ON books
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "books_admin_insert" ON books;
CREATE POLICY "books_admin_insert" ON books
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "books_admin_update" ON books;
CREATE POLICY "books_admin_update" ON books
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "books_admin_delete" ON books;
CREATE POLICY "books_admin_delete" ON books
  FOR DELETE USING (is_admin());

-- ============================================================
-- 2. ORDERS - users see own orders, admin sees all
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_admin_all" ON orders;
CREATE POLICY "orders_admin_all" ON orders
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "orders_user_read_own" ON orders;
CREATE POLICY "orders_user_read_own" ON orders
  FOR SELECT USING (
    auth.uid()::text = user_id::text
    OR customer_email = (auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "orders_user_insert" ON orders;
CREATE POLICY "orders_user_insert" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_user_update_own" ON orders;
CREATE POLICY "orders_user_update_own" ON orders
  FOR UPDATE USING (
    auth.uid()::text = user_id::text
    OR customer_email = (auth.jwt() ->> 'email')
  );

-- ============================================================
-- 3. ORDER_ITEMS - users see items from own orders, admin all
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
CREATE POLICY "order_items_admin_all" ON order_items
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "order_items_user_read" ON order_items;
CREATE POLICY "order_items_user_read" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id::text = auth.uid()::text
        OR orders.customer_email = (auth.jwt() ->> 'email')
      )
    )
  );

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 4. PROFILES - users manage own, admin reads all
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "profiles_user_read_own" ON profiles;
CREATE POLICY "profiles_user_read_own" ON profiles
  FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "profiles_user_upsert_own" ON profiles;
CREATE POLICY "profiles_user_upsert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "profiles_user_update_own" ON profiles;
CREATE POLICY "profiles_user_update_own" ON profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- ============================================================
-- 5. VOUCHERS - public read (checkout validation), admin write
-- ============================================================
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vouchers_public_read" ON vouchers;
CREATE POLICY "vouchers_public_read" ON vouchers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "vouchers_admin_all" ON vouchers;
CREATE POLICY "vouchers_admin_all" ON vouchers
  FOR ALL USING (is_admin());

-- ============================================================
-- 6. REVIEWS - public read, authenticated insert own
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_user_insert" ON reviews;
CREATE POLICY "reviews_user_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (is_admin());

-- ============================================================
-- 7. WISHLISTS - users manage own only
-- ============================================================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_user_all" ON wishlists;
CREATE POLICY "wishlists_user_all" ON wishlists
  FOR ALL USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "wishlists_admin_read" ON wishlists;
CREATE POLICY "wishlists_admin_read" ON wishlists
  FOR SELECT USING (is_admin());

-- ============================================================
-- 8. WAITLISTS - users manage own, admin reads all
-- ============================================================
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlists_user_insert" ON waitlists;
CREATE POLICY "waitlists_user_insert" ON waitlists
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "waitlists_user_read_own" ON waitlists;
CREATE POLICY "waitlists_user_read_own" ON waitlists
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "waitlists_admin_all" ON waitlists;
CREATE POLICY "waitlists_admin_all" ON waitlists
  FOR ALL USING (is_admin());

-- ============================================================
-- 9. SUBSCRIPTIONS - users read own, admin manages all
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_admin_all" ON subscriptions;
CREATE POLICY "subscriptions_admin_all" ON subscriptions
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "subscriptions_user_read_own" ON subscriptions;
CREATE POLICY "subscriptions_user_read_own" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "subscriptions_user_update_own" ON subscriptions;
CREATE POLICY "subscriptions_user_update_own" ON subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ============================================================
-- 10. SUBSCRIPTION_PAYMENTS - admin only
-- ============================================================
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_payments_admin_all" ON subscription_payments;
CREATE POLICY "sub_payments_admin_all" ON subscription_payments
  FOR ALL USING (is_admin());

-- ============================================================
-- 11. FLOWER_LETTERS - admin only
-- ============================================================
ALTER TABLE flower_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flower_letters_admin_all" ON flower_letters;
CREATE POLICY "flower_letters_admin_all" ON flower_letters
  FOR ALL USING (is_admin());

-- ============================================================
-- 12. LOTTERY_ENTRIES - admin only
-- ============================================================
ALTER TABLE lottery_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lottery_entries_admin_all" ON lottery_entries;
CREATE POLICY "lottery_entries_admin_all" ON lottery_entries
  FOR ALL USING (is_admin());

-- ============================================================
-- Done! All tables now secured with RLS.
-- ============================================================
