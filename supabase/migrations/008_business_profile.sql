-- Menu/service items (restaurants: dishes, salons: services, retail: products, etc.)
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  price numeric,
  description text,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_business ON menu_items(business_id, active);

-- Track item mentions extracted from inbound customer messages
CREATE TABLE IF NOT EXISTS menu_item_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral')) DEFAULT 'neutral',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_mentions_item ON menu_item_mentions(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_mentions_business ON menu_item_mentions(business_id, created_at DESC);
