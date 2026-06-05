-- Scaleva database schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI) to provision
-- the tables and Row Level Security policies the app expects.

-- Needed for gen_random_uuid().
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- businesses
-- owner_id links a business to the auth user that created it. (Not in the
-- original column list, but required so RLS can isolate each tenant's data.)
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  industry    text,
  voice       text,
  goals       text,
  data_source text,
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists businesses_owner_id_idx on public.businesses (owner_id);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  name              text not null,
  phone             text,
  email             text,
  last_purchase     timestamptz,
  spend_history     jsonb not null default '[]'::jsonb,
  next_contact_date timestamptz
);

create index if not exists customers_business_id_idx on public.customers (business_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  content     text not null,
  sent_at     timestamptz,
  status      text not null default 'queued',
  direction   text not null default 'outbound'
    check (direction in ('outbound', 'inbound'))
);

create index if not exists messages_business_id_idx on public.messages (business_id);
create index if not exists messages_customer_id_idx on public.messages (customer_id);

-- ---------------------------------------------------------------------------
-- interactions
-- ---------------------------------------------------------------------------
create table if not exists public.interactions (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  type        text not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists interactions_customer_id_idx on public.interactions (customer_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Each table is scoped to the businesses owned by the current auth user.
-- ---------------------------------------------------------------------------
alter table public.businesses   enable row level security;
alter table public.customers    enable row level security;
alter table public.messages     enable row level security;
alter table public.interactions enable row level security;

-- businesses: an owner can do anything with their own row.
create policy "Owners manage their businesses"
  on public.businesses
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- customers: scoped through the parent business.
create policy "Owners manage their customers"
  on public.customers
  for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = customers.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = customers.business_id and b.owner_id = auth.uid()
    )
  );

-- messages: scoped through the parent business.
create policy "Owners manage their messages"
  on public.messages
  for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = messages.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = messages.business_id and b.owner_id = auth.uid()
    )
  );

-- interactions: scoped through the customer -> business chain.
create policy "Owners manage their interactions"
  on public.interactions
  for all
  using (
    exists (
      select 1
      from public.customers c
      join public.businesses b on b.id = c.business_id
      where c.id = interactions.customer_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.customers c
      join public.businesses b on b.id = c.business_id
      where c.id = interactions.customer_id and b.owner_id = auth.uid()
    )
  );
