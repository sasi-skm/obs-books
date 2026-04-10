-- OBS Books: Bilingual textile condition notes
--
-- condition_note already exists (English). Add a Thai column so the
-- customer-facing product page can swap languages like the condition
-- guide modal does.

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS condition_note_th TEXT;
