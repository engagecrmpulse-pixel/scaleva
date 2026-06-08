ALTER TABLE messages ADD COLUMN IF NOT EXISTS replied boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  date date not null,
  messages_sent integer default 0,
  replies_received integer default 0,
  return_visits integer default 0,
  unique(business_id, date)
);
