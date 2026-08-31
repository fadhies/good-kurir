import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getBlockedDriverIds } from '../../shared/remittance.ts';
import { selectQuery } from '../../shared/supabase.ts';

// Pre-flight check: apakah ada minimal satu driver online & verified yang
// bisa melayani mode pengantaran terpilih dan tidak sedang diblokir setoran.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mode = (body.mode || 'hemat') === 'cepat' ? 'cepat' : 'hemat';
    const MAX_HEMAT = 3;

    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({
      verification_status: 'approved',
      is_online: true,
    });

    if (!drivers.length) {
      return Response.json({ available: false, reason: 'Belum ada driver online saat ini' });
    }

    const activeOrders = await selectQuery('orders', {
      filter: { status: { $in: ['driver_assigned', 'at_store', 'awaiting_payment', 'paid', 'on_the_way'] } },
      limit: 500
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

    const blocked = await getBlockedDriverIds(base44, drivers.map((d) => d.user_id));

    for (const d of drivers) {
      if (d.current_lat == null || d.current_lng == null) continue;
      if (blocked.has(d.user_id)) continue;
      const activeCount = activeCountByDriver[d.user_id] || 0;
      const activeHemat = activeHematCountByDriver[d.user_id] || 0;
      if (mode === 'cepat' ? activeCount !== 0 : activeHemat >= MAX_HEMAT) continue;
      return Response.json({ available: true });
    }

    const reason = mode === 'cepat'
      ? 'Tidak ada driver yang sedang kosong untuk mode cepat'
      : 'Semua driver sudah mencapai batas orderan atau belum setor harian';
    return Response.json({ available: false, reason });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}