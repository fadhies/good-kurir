-- Realtime Broadcast signals untuk Good Kurir.
-- Jalankan sekali di Supabase Dashboard -> SQL Editor.
--
-- Setiap trigger mengirim payload MINIMAL (hanya id/status) ke topik channel;
-- klien lalu menarik ulang data lengkap lewat endpoint yang menerapkan ACL
-- (supabaseCrud). Tidak ada data pribadi yang disiarkan melalui channel.
-- Sisi klien: src/lib/realtime.js
-- Topik: order:<id>, user:<id>, orders:all, withdrawals:all

-- ============================================================
-- 1) orders
-- ============================================================
create or replace function public.broadcast_order_changes()
returns trigger
security definer
set search_path = ''
as $$
declare
  r record;
begin
  r := case when tg_op = 'DELETE' then old else new end;

  -- Halaman pelacakan pesanan
  perform realtime.broadcast_changes(
    'order:' || r.id,
    tg_op, tg_op, tg_table_name, tg_table_schema,
    jsonb_build_object('id', r.id, 'status', r.status),
    null
  );

  -- Dashboard driver & daftar pesanan
  perform realtime.broadcast_changes(
    'orders:all',
    tg_op, tg_op, tg_table_name, tg_table_schema,
    jsonb_build_object('id', r.id, 'status', r.status),
    null
  );

  -- Sinyal personal untuk pemesan & driver (lonceng, dompet, listener chat)
  if r.created_by_id is not null then
    perform realtime.broadcast_changes(
      'user:' || r.created_by_id,
      tg_op, tg_op, tg_table_name, tg_table_schema,
      jsonb_build_object('id', r.id, 'status', r.status),
      null
    );
  end if;
  if r.driver_id is not null and (r.created_by_id is null or r.driver_id <> r.created_by_id) then
    perform realtime.broadcast_changes(
      'user:' || r.driver_id,
      tg_op, tg_op, tg_table_name, tg_table_schema,
      jsonb_build_object('id', r.id, 'status', r.status),
      null
    );
  end if;

  return null;
end;
$$ language plpgsql;

drop trigger if exists broadcast_order_changes_trigger on public.orders;
create trigger broadcast_order_changes_trigger
after insert or update or delete on public.orders
for each row execute function public.broadcast_order_changes();

-- ============================================================
-- 2) chat_messages -> order:<order_id>
-- ============================================================
create or replace function public.broadcast_chat_changes()
returns trigger
security definer
set search_path = ''
as $$
declare
  r record;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  perform realtime.broadcast_changes(
    'order:' || r.order_id,
    tg_op, tg_op, tg_table_name, tg_table_schema,
    jsonb_build_object('order_id', r.order_id),
    null
  );
  return null;
end;
$$ language plpgsql;

drop trigger if exists broadcast_chat_changes_trigger on public.chat_messages;
create trigger broadcast_chat_changes_trigger
after insert or update or delete on public.chat_messages
for each row execute function public.broadcast_chat_changes();

-- ============================================================
-- 3) notifications -> user:<user_id>
-- ============================================================
create or replace function public.broadcast_notification_changes()
returns trigger
security definer
set search_path = ''
as $$
declare
  r record;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  perform realtime.broadcast_changes(
    'user:' || r.user_id,
    tg_op, tg_op, tg_table_name, tg_table_schema,
    jsonb_build_object('user_id', r.user_id, 'type', r.type),
    null
  );
  return null;
end;
$$ language plpgsql;

drop trigger if exists broadcast_notification_changes_trigger on public.notifications;
create trigger broadcast_notification_changes_trigger
after insert or update or delete on public.notifications
for each row execute function public.broadcast_notification_changes();

-- ============================================================
-- 4) wallet_transactions -> user:<user_id>
-- ============================================================
create or replace function public.broadcast_wallet_changes()
returns trigger
security definer
set search_path = ''
as $$
declare
  r record;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  perform realtime.broadcast_changes(
    'user:' || r.user_id,
    tg_op, tg_op, tg_table_name, tg_table_schema,
    jsonb_build_object('user_id', r.user_id),
    null
  );
  return null;
end;
$$ language plpgsql;

drop trigger if exists broadcast_wallet_changes_trigger on public.wallet_transactions;
create trigger broadcast_wallet_changes_trigger
after insert or update or delete on public.wallet_transactions
for each row execute function public.broadcast_wallet_changes();

-- ============================================================
-- 5) withdrawal_requests -> user:<user_id> + withdrawals:all
-- ============================================================
create or replace function public.broadcast_withdrawal_changes()
returns trigger
security definer
set search_path = ''
as $$
declare
  r record;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  perform realtime.broadcast_changes(
    'user:' || r.user_id,
    tg_op, tg_op, tg_table_name, tg_table_schema,
    jsonb_build_object('user_id', r.user_id, 'status', r.status),
    null
  );
  perform realtime.broadcast_changes(
    'withdrawals:all',
    tg_op, tg_op, tg_table_name, tg_table_schema,
    jsonb_build_object('user_id', r.user_id, 'status', r.status),
    null
  );
  return null;
end;
$$ language plpgsql;

drop trigger if exists broadcast_withdrawal_changes_trigger on public.withdrawal_requests;
create trigger broadcast_withdrawal_changes_trigger
after insert or update or delete on public.withdrawal_requests
for each row execute function public.broadcast_withdrawal_changes();