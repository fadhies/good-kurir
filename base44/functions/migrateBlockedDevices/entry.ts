import { secrets } from 'base44:runtime';
import { selectQuery } from '../../shared/supabase.ts';

// Buat tabel blocked_devices untuk pemblokiran perangkat oleh admin.
// Dieksekusi lewat Supabase Management API memakai secret SUPABASE_ACCESS_TOKEN.
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
      create table if not exists blocked_devices (
        id text primary key,
        device_id text not null unique,
        reason text,
        created_date timestamptz,
        created_by_id text
      );
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

    // Pastikan tabel terbaca PostgREST.
    const probe = await selectQuery('blocked_devices', { limit: 1 });

    return Response.json({ ok: true, result: text, probe_count: probe.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}