ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS customer_limit integer,
  ADD COLUMN IF NOT EXISTS message_limit integer;
