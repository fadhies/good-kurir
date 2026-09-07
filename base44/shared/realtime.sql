-- Realtime Broadcast signals untuk Good Kurir (VERSI 2 — pakai realtime.send).
-- Jalankan SEKALI lagi di Supabase Dashboard -> SQL Editor (menggantikan versi lama).
--
-- Versi lama memakai realtime.broadcast_changes dan gagal karena signature di
-- project ini tidak cocok. Versi ini memakai realtime.send() yang tersedia di
-- semua project, dengan payload MINIMAL (id/status saja) — data lengkap selalu
-- ditarik ulang lewat endpoint ACL (supabaseCrud).
--
-- Catatan: broadcast dari database default-nya PRIVATE; kita kirim dengan flag
-- `false` (publik) agar klien anon (Base44 auth, bukan Supabase auth) bisa
-- menerima. Topik random (order:<id>, user:<id>) sehingga tidak bisa ditebak.
-- Sisi klien: src/lib/realtime.js

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
  begin
    -- Halaman pelacakan pesanan
    perform realtime.send(
      jsonb_build_object('id', r.id, 'status', r.status),
      tg_op,
      'order:' || r.id,
      false
    );
    -- Dashboard driver & daftar pesanan
    perform realtime.send(
      jsonb_build_object('id', r.id, 'status', r.status),
      tg_op,
      'orders:all',
      false
    );
    -- Sinyal personal pemesan & driver (lonceng, dompet, listener chat)
    if r.created_by_id is not null then
      perform realtime.send(
        jsonb_build_object('id', r.id, 'status', r.status),
        tg_op,
        'user:' || r.created_by_id,
        false
      );
    end if;
    if r.driver_id is not null and (r.created_by_id is null or r.driver_id <> r.created_by_id) then
      perform realtime.send(
        jsonb_build_object('id', r.id, 'status', r.status),
        tg_op,
        'user:' || r.driver_id,
        false
      );
    end if;
  exception when others then
    null; -- jangan gagalkan penulisan data bila realtime bermasalah
  end;
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
  begin
    perform realtime.send(
      jsonb_build_object('order_id', r.order_id),
      tg_op,
      'order:' || r.order_id,
      false
    );
  exception when others then
    null;
  end;
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
  begin
    perform realtime.send(
      jsonb_build_object('user_id', r.user_id, 'type', r.type),
      tg_op,
      'user:' || r.user_id,
      false
    );
  exception when others then
    null;
  end;
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
  begin
    perform realtime.send(
      jsonb_build_object('user_id', r.user_id),
      tg_op,
      'user:' || r.user_id,
      false
    );
  exception when others then
    null;
  end;
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
  begin
    perform realtime.send(
      jsonb_build_object('user_id', r.user_id, 'status', r.status),
      tg_op,
      'user:' || r.user_id,
      false
    );
    perform realtime.send(
      jsonb_build_object('user_id', r.user_id, 'status', r.status),
      tg_op,
      'withdrawals:all',
      false
    );
  exception when others then
    null;
  end;
  return null;
end;
$$ language plpgsql;

drop trigger if exists broadcast_withdrawal_changes_trigger on public.withdrawal_requests;
create trigger broadcast_withdrawal_changes_trigger
after insert or update or delete on public.withdrawal_requests
for each row execute function public.broadcast_withdrawal_changes();