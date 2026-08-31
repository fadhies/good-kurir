-- Schema for Good Kurir data moved to Supabase.
-- Run this in your Supabase project (SQL Editor).
-- Access pattern: all reads/writes go through Base44 backend functions using the
-- service_role key, which bypasses RLS. RLS is enabled with NO policies, so the
-- anon/authenticated roles cannot access these tables directly.
-- Primary keys are TEXT so existing Base44 record ids are preserved during migration.

create extension if not exists pgcrypto;

-- Orders
create table if not exists orders (
  id text primary key,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text,
  user_id text,
  driver_id text,
  type text,
  mode text,
  payment_method text,
  store_name text,
  store_address text,
  store_detail text,
  store_lat numeric,
  store_lng numeric,
  destination_address text,
  destination_lat numeric,
  destination_lng numeric,
  destination_detail text,
  notes text,
  status text,
  item_cost numeric,
  delivery_fee numeric,
  service_fee numeric,
  driver_remit_fee numeric,
  app_fee numeric,
  admin_fee numeric,
  driver_earning numeric,
  total_amount numeric,
  distance_km numeric,
  store_bill_note text,
  qris_photo text,
  payment_proof_photo text,
  store_qris_photo text,
  driver_dana_number text,
  user_rating numeric,
  midtrans_paid boolean
);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_user_idx on orders (user_id);
create index if not exists orders_driver_idx on orders (driver_id);

-- Driver profiles
create table if not exists driver_profiles (
  id text primary key,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text,
  user_id text,
  vehicle_type text,
  license_plate text,
  ktp_photo text,
  selfie_with_ktp text,
  verification_status text,
  rejection_reason text,
  is_online boolean,
  is_available boolean,
  current_lat numeric,
  current_lng numeric,
  current_address text,
  rating numeric,
  total_trips integer
);
create index if not exists driver_profiles_user_idx on driver_profiles (user_id);
create index if not exists driver_profiles_status_idx on driver_profiles (verification_status);

-- Driver remittances
create table if not exists driver_remittances (
  id text primary key,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text,
  user_id text,
  date text,
  amount numeric,
  transaction_count integer,
  proof_photo text,
  status text,
  note text
);
create index if not exists driver_remittances_user_idx on driver_remittances (user_id);
create index if not exists driver_remittances_date_idx on driver_remittances (date);

-- Chat messages
create table if not exists chat_messages (
  id text primary key,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text,
  order_id text,
  sender_id text,
  sender_name text,
  sender_role text,
  text text,
  participants jsonb
);
create index if not exists chat_messages_order_idx on chat_messages (order_id);

-- Wallet transactions
create table if not exists wallet_transactions (
  id text primary key,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text,
  user_id text,
  type text,
  amount numeric,
  description text,
  order_id text
);
create index if not exists wallet_transactions_user_idx on wallet_transactions (user_id);

-- Notifications
create table if not exists notifications (
  id text primary key,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text,
  user_id text,
  type text,
  title text,
  body text,
  order_id text,
  is_read boolean
);
create index if not exists notifications_user_idx on notifications (user_id);

-- Withdrawal requests
create table if not exists withdrawal_requests (
  id text primary key,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text,
  user_id text,
  amount numeric,
  bank_name text,
  account_number text,
  account_holder_name text,
  status text,
  transfer_proof_photo text,
  processed_by_id text,
  rejection_reason text
);
create index if not exists withdrawal_requests_user_idx on withdrawal_requests (user_id);
create index if not exists withdrawal_requests_status_idx on withdrawal_requests (status);

-- Lock down: only service_role (used by Base44 backend functions) can access.
alter table orders enable row level security;
alter table driver_profiles enable row level security;
alter table driver_remittances enable row level security;
alter table chat_messages enable row level security;
alter table wallet_transactions enable row level security;
alter table notifications enable row level security;
alter table withdrawal_requests enable row level security;
-- No policies are defined; anon/authenticated roles get nothing.