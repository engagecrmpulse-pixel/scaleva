ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS square_item_id text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS times_ordered integer DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS total_revenue numeric DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS unique_customers integer DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS last_ordered timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_square ON menu_items(business_id, square_item_id)
  WHERE square_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_business ON menu_items(business_id);
