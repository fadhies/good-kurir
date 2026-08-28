import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { walletBalancesByUser } from '../../shared/wallet.ts';

// Pre-flight check: apakah ada minimal satu driver online & verified yang
// bisa melayani mode pengantaran + metode pembayaran terpilih user.
// Tidak melakukan assignment, hanya mengembalikan ketersediaan.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mode = (body.mode || 'hemat') === 'cepat' ? 'cepat' : 'hemat';
    const method = body.paymentMethod === 'qris' ? 'qris' : 'cash';
    const MAX_HEMAT = 3;
    const SERVICE_FEE = 2000;

    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({
      verification_status: 'approved',
      is_online: true,
    });

    if (!drivers.length) {
      return Response.json({ available: false, reason: 'Belum ada driver online saat ini' });
    }

    const activeOrders = await base44.asServiceRole.entities.Order.filter({
      status: { $in: ['driver_assigned', 'at_store', 'awaiting_payment', 'paid', 'on_the_way'] }
    });
    const activeCountByDriver = {};
    const activeHematCountByDriver = {};
    for (const o of activeOrders) {
      if (!o.driver_id) continue;
      activeCountByDriver[o.driver_id] = (activeCountByDriver[o.driver_id] || 0) + 1;
      if ((o.mode || 'hemat') === 'hemat') {
        activeHematCountByDriver[o.driver_id] = (activeHematCountByDriver[o.driver_id] || 0) + 1;
      }
    }

    const balances = method === 'cash'
      ? await walletBalancesByUser(base44, drivers.map((d) => d.user_id))
      : {};

    for (const d of drivers) {
      if (d.current_lat == null || d.current_lng == null) continue;
      const activeCount = activeCountByDriver[d.user_id] || 0;
      const activeHemat = activeHematCountByDriver[d.user_id] || 0;
      // Cepat: driver harus kosong (tidak ada order aktif). Hemat: < 3 order hemat aktif.
      if (mode === 'cepat' ? activeCount !== 0 : activeHemat >= MAX_HEMAT) continue;
      // Tunai: butuh saldo dompet >= Rp2.000
      if (method === 'cash' && (balances[d.user_id] || 0) < SERVICE_FEE) continue;
      return Response.json({ available: true });
    }

    let reason;
    if (method === 'cash') {
      reason = 'Tidak ada driver dengan saldo dompet cukup untuk pembayaran tunai';
    } else if (mode === 'cepat') {
      reason = 'Tidak ada driver yang sedang kosong untuk mode cepat';
    } else {
      reason = 'Semua driver sudah mencapai batas 3 orderan hemat';
    }
    return Response.json({ available: false, reason });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}