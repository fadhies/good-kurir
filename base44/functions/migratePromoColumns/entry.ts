import { secrets } from 'base44:runtime';
import { selectQuery } from '../../shared/supabase.ts';

// Jalankan ALTER TABLE orders untuk kolom promo (device_id, promo_free_service)
// dan indeksnya. Dieksekusi lewat Supabase Management API memakai token yang
// disimpan sebagai secret SUPABASE_ACCESS_TOKEN. Sekali jalan — setelah sukses,
// workflow pemicunya di-archive.
export default async function(req) {
  try {
    const token = (secrets.get('SUPABASE_ACCESS_TOKEN') || '').trim();
    const url = (secrets.get('SUPABASE_URL') || '').replace(/\/+$/, '');
    if (!token || !url) {
      return Response.json({ error: 'SUPABASE_ACCESS_TOKEN / SUPABASE_URL belum diatur' }, { status: 500 });
    }
    // Project ref dari URL, mis. https://abc123.supabase.co -> abc123
    const match = url.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co/i);
    if (!match) return Response.json({ error: 'SUPABASE_URL tidak dikenali' }, { status: 500 });
    const projectRef = match[1];

    const sql = `
      alter table orders add column if not exists device_id text;
      alter table orders add column if not exists promo_free_service boolean;
      create index if not exists orders_device_status_idx on orders (device_id, status);
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

    // Pastikan kolom benar-benar terbaca oleh PostgREST.
    const probe = await selectQuery('orders', { filter: { status: 'completed' }, limit: 1 });
    return Response.json({ ok: true, result: text, probe_count: probe.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}