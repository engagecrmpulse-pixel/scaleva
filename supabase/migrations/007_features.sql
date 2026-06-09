-- Feature 2: Revenue attribution
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attributed boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attributed_revenue numeric DEFAULT 0;

-- Feature 4: Review request tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_review_request_at timestamptz;

-- Feature 5: Win-back sequence enrollments
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  step integer DEFAULT 1 NOT NULL,
  enrolled_at timestamptz DEFAULT now() NOT NULL,
  next_step_at timestamptz,
  completed boolean DEFAULT false NOT NULL,
  exited_reason text,
  UNIQUE(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_due
  ON sequence_enrollments(business_id, next_step_at)
  WHERE completed = false;
