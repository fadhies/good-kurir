import { secrets } from 'base44:runtime';
import { selectQuery } from '../../shared/supabase.ts';

// Migrasi sekali jalan: tabel chat langsung admin-driver (admin_chat_messages),
// terpisah dari chat_messages yang terikat pesanan. Pola sama dengan
// migrateReferralTables (Supabase Management API + secret SUPABASE_ACCESS_TOKEN).
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
      create table if not exists admin_chat_messages (
        id text primary key,
        created_date timestamptz,
        updated_date timestamptz,
        created_by_id text,
        driver_id text,
        sender_id text,
        sender_name text,
        sender_role text,
        text text
      );
      create index if not exists admin_chat_messages_driver_idx
        on admin_chat_messages (driver_id, created_date);
      create index if not exists admin_chat_messages_sender_idx
        on admin_chat_messages (sender_id);

      alter table admin_chat_messages enable row level security;
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
    const probe = await selectQuery('admin_chat_messages', { filter: {}, limit: 1 });
    return Response.json({ ok: true, result: text, probe_count: probe.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}