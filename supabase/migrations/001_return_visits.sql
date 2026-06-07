ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS return_visit_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_return_date timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
