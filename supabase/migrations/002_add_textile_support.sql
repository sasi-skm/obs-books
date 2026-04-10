-- OBS Books: Add vintage linens / textile support
-- Run this once in Supabase SQL Editor.
--
-- Note: this project uses a single `books` table for all products.
-- Rather than renaming to `products`, we extend `books` with textile-
-- specific columns and a `product_type` discriminator.

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'book',
  ADD COLUMN IF NOT EXISTS dimensions_width INTEGER,
  ADD COLUMN IF NOT EXISTS dimensions_length INTEGER,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS technique TEXT,
  ADD COLUMN IF NOT EXISTS era TEXT;

-- Constrain product_type to known values
ALTER TABLE books
  DROP CONSTRAINT IF EXISTS books_product_type_check;
ALTER TABLE books
  ADD CONSTRAINT books_product_type_check
  CHECK (product_type IN ('book', 'textile'));

-- Backfill any existing rows (defensive — DEFAULT already handles new rows)
UPDATE books SET product_type = 'book' WHERE product_type IS NULL;

-- Index for filtering the admin Linens list and category pages
CREATE INDEX IF NOT EXISTS idx_books_product_type ON books(product_type);

-- Verify
SELECT product_type, COUNT(*) FROM books GROUP BY product_type;
