-- OBS Books: Category rename migration
-- Run this once in Supabase SQL Editor to update all existing books

-- "Tea & Country Life" (tea-country) → "Country Life & Nature Journals" (country-life)
UPDATE books SET category = 'country-life' WHERE category = 'tea-country';

-- "Art & Nature Journals" (art-nature) → "Art & Illustration" (art-illustration)
UPDATE books SET category = 'art-illustration' WHERE category = 'art-nature';

-- Verify results
SELECT category, COUNT(*) as book_count
FROM books
GROUP BY category
ORDER BY category;
