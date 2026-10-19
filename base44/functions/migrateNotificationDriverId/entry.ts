import { secrets } from 'base44:runtime';
import { selectQuery } from '../../shared/supabase.ts';

// Migrasi sekali jalan: kolom driver_id pada tabel notifications, dipakai
// notifikasi chat admin-driver agar admin membuka langsung chat driver
// pengirim (tanpa mencarinya dari daftar).
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
      alter table notifications add column if not exists driver_id text;
      create index if not exists notifications_driver_idx on notifications (driver_id);
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

    // Pastikan tabel tetap terbaca baik oleh endpoint ACL.
    const probe = await selectQuery('notifications', { filter: {}, limit: 1 });
    return Response.json({ ok: true, result: text, probe_count: probe.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}