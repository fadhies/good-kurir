import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { selectQuery, insertOne } from '../../shared/supabase.ts';

// Kaitkan pengguna yang sedang login dengan kode referal yang ia bawa saat
// membuka tautan referal (disimpan di localStorage aplikasi). Hanya pengguna
// baru (belum pernah membuat pesanan) yang bisa terhubung, tanpa klaim sendiri.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const code = String(body.code || '').trim().toUpperCase();
    if (!code) return Response.json({ error: 'Kode referal diperlukan' }, { status: 400 });

    const owners = await selectQuery('referral_codes', { filter: { code }, limit: 1 });
    if (!owners.length) return Response.json({ ok: false, reason: 'invalid' });
    const referrerId = owners[0].user_id;
    if (referrerId === user.id) return Response.json({ ok: false, reason: 'self' });

    // Satu user hanya bisa terhubung ke satu pemberi referal, sekali saja.
    const existing = await selectQuery('referrals', { filter: { referee_user_id: user.id }, limit: 1 });
    if (existing.length) return Response.json({ ok: true, already: true });

    // Hanya pengguna baru: belum pernah membuat pesanan apa pun.
    const orders = await selectQuery('orders', { filter: { created_by_id: user.id }, limit: 1 });
    if (orders.length) return Response.json({ ok: false, reason: 'not_new' });

    const now = new Date().toISOString();
    await insertOne('referrals', {
      id: crypto.randomUUID(),
      created_date: now,
      updated_date: now,
      created_by_id: user.id,
      referrer_user_id: referrerId,
      referee_user_id: user.id,
      status: 'pending',
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}