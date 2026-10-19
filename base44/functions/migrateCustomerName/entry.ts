import { secrets } from 'base44:runtime';
import { selectQuery, updateById } from '../../shared/supabase.ts';

// Tambahkan kolom customer_name pada tabel orders (nama pemesan untuk driver)
// dan backfill nama dari akun Base44 untuk order lama yang belum memilikinya.
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
      alter table orders add column if not exists customer_name text;
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

    // Pastikan kolom terbaca PostgREST sebelum backfill.
    const probe = await selectQuery('orders', { filter: { status: 'completed' }, limit: 1 });

    // Backfill nama pemesan untuk order lama yang belum punya customer_name.
    const base44 = (await import('npm:@base44/sdk@0.8.54')).createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.list();
    const nameById = new Map(users.map((u) => [u.id, u.full_name || u.email]));
    const orders = await selectQuery('orders', { limit: 1000 });
    let backfilled = 0;
    for (const o of orders) {
      if (o.customer_name) continue;
      const name = nameById.get(o.user_id || o.created_by_id);
      if (name) {
        try {
          await updateById('orders', o.id, { customer_name: name });
          backfilled++;
        } catch {}
      }
    }

    return Response.json({ ok: true, result: text, probe_count: probe.length, backfilled });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}