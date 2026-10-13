import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { selectQuery } from '../../shared/supabase.ts';

// Promo "Gratis Fee Layanan 3 Order Pertama": kuota dihitung per perangkat
// (device_id) dan hanya order yang berstatus 'completed' yang terhitung,
// sehingga order batal/gagal tidak menghabiskan promo. Kelayakan selalu
// dihitung ulang dari jumlah order selesai saat dipanggil, jadi dua order
// yang selesai hampir bersamaan tetap konsisten (tidak ada kuota yang
// dikurangi manual dan bisa salah hitung).
const PROMO_LIMIT = 3;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const deviceId = String(body?.deviceId || '').trim();
    if (!deviceId) return Response.json({ error: 'deviceId required' }, { status: 400 });

    const rows = await selectQuery('orders', {
      filter: { device_id: deviceId, status: 'completed' },
      limit: PROMO_LIMIT,
    });
    const completed = rows.length;
    const remaining = Math.max(0, PROMO_LIMIT - completed);

    return Response.json({
      ok: true,
      completed,
      remaining,
      eligible: completed < PROMO_LIMIT,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}