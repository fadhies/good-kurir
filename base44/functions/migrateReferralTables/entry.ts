import { secrets } from 'base44:runtime';
import { selectQuery } from '../../shared/supabase.ts';

// Migrasi sekali jalan: tabel program referal (referral_codes, referrals,
// coupons) + kolom kupon pada orders. Dieksekusi via Supabase Management API
// memakai secret SUPABASE_ACCESS_TOKEN, pola sama dengan migratePromoColumns.
export default async function(req) {
  try {
    const token = (secrets.get('SUPABASE_ACCESS_TOKEN') || '').trim();
    const url = (secrets.get('SUPABASE_URL') || '').replace(/\/+$/, '');
    if (!token || !url) {
      return Response.json({ error: 'SUPABASE_ACCESS_TOKEN / SUPABASE_URL belum diatur' }, { status: 500 });
    }
    const match = url.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co/i);
    if (!match) return Response.json({ error: 'SUPABASE_URL tidak dikenali' }, { status: 500 });
    const projectRef = match[1];

    const sql = `
      create table if not exists referral_codes (
        id text primary key,
        created_date timestamptz,
        updated_date timestamptz,
        created_by_id text,
        user_id text,
        code text
      );
      create unique index if not exists referral_codes_code_idx on referral_codes (code);
      create index if not exists referral_codes_user_idx on referral_codes (user_id);

      create table if not exists referrals (
        id text primary key,
        created_date timestamptz,
        updated_date timestamptz,
        created_by_id text,
        referrer_user_id text,
        referee_user_id text,
        status text,
        rewarded_at timestamptz,
        order_id text
      );
      create unique index if not exists referrals_referee_idx on referrals (referee_user_id);
      create index if not exists referrals_referrer_idx on referrals (referrer_user_id);

      create table if not exists coupons (
        id text primary key,
        created_date timestamptz,
        updated_date timestamptz,
        created_by_id text,
        user_id text,
        type text,
        amount numeric,
        status text,
        source text,
        referee_user_id text,
        order_id text,
        used_at timestamptz
      );
      create index if not exists coupons_user_idx on coupons (user_id);
      create index if not exists coupons_status_idx on coupons (status);

      alter table orders add column if not exists coupon_id text;
      alter table orders add column if not exists coupon_discount numeric;
      create index if not exists orders_coupon_idx on orders (coupon_id);

      alter table referral_codes enable row level security;
      alter table referrals enable row level security;
      alter table coupons enable row level security;
      notify pgrst, 'reload schema';
    `;
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    if (!res.ok) {
      return Response.json({ error: `Management API ${res.status}: ${text}` }, { status: 500 });
    }

    // Pastikan tabel baru terbaca oleh PostgREST.
    const probe = await selectQuery('coupons', { filter: { status: 'unused' }, limit: 1 });
    return Response.json({ ok: true, result: text, probe_count: probe.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}