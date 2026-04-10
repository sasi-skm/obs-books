-- OBS Books: Add condition_note column for textile products
--
-- Textiles show a free-text condition note in a separate box below
-- their description, so we store it in its own column rather than
-- mixing it into the description field.
-- Books may also use this field in the future; it is optional.

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS condition_note TEXT;
