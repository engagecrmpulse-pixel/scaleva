ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_since timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS favorite_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_order_value numeric DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spend numeric DEFAULT 0;
