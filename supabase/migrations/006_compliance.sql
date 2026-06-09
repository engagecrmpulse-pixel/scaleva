-- Idempotency for webhooks (Stripe + Twilio)
CREATE TABLE IF NOT EXISTS processed_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  processed_at timestamptz DEFAULT now()
);

-- Opt-out and consent tracking on customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opted_out boolean DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS consent_given boolean DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS consent_date timestamptz;

-- Customer lifetime value (kept in sync with spend_history sum)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ltv numeric DEFAULT 0;

-- Compliance columns on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS consent_verified boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS twilio_sid text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS topic text;

-- Best reply time per customer
CREATE TABLE IF NOT EXISTS customer_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  best_reply_hour integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(customer_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_business_sent ON messages(business_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_opted_out ON customers(business_id, opted_out);
CREATE INDEX IF NOT EXISTS idx_customers_next_contact ON customers(business_id, next_contact_date);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event ON processed_webhooks(event_id);
CREATE INDEX IF NOT EXISTS idx_customer_insights_customer ON customer_insights(customer_id);
