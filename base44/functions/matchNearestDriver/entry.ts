import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { haversineKm } from '../../shared/geo.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.driver_id) {
      return Response.json({ error: 'Driver already assigned' }, { status: 400 });
    }

    const mode = order.mode || 'hemat';
    const MAX_HEMAT = 3;

    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({
      is_online: true
    });

    if (!drivers.length) {
      return Response.json({ error: 'Belum ada driver online saat ini' }, { status: 404 });
    }

    // Hitung jumlah orderan aktif per driver
    const activeOrders = await base44.asServiceRole.entities.Order.filter({
      status: { $in: ['driver_assigned', 'at_store', 'awaiting_payment', 'paid', 'on_the_way'] }
    });
    const activeCountByDriver = {};
    for (const o of activeOrders) {
      if (o.driver_id) activeCountByDriver[o.driver_id] = (activeCountByDriver[o.driver_id] || 0) + 1;
    }

    let nearest = null;
    let minDist = Infinity;
    for (const d of drivers) {
      if (d.current_lat == null || d.current_lng == null) continue;
      const activeCount = activeCountByDriver[d.user_id] || 0;
      // hemat: maks 3 orderan aktif sekaligus; cepat: harus tanpa orderan aktif
      if (mode === 'cepat' ? activeCount !== 0 : activeCount >= MAX_HEMAT) continue;
      const dist = haversineKm(order.store_lat, order.store_lng, d.current_lat, d.current_lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = d;
      }
    }

    if (!nearest) {
      return Response.json({
        error: mode === 'cepat'
          ? 'Tidak ada driver yang sedang kosong untuk mode cepat'
          : 'Semua driver sudah mencapai batas 3 orderan'
      }, { status: 404 });
    }

    const distance = Math.round(minDist * 100) / 100;

    await base44.asServiceRole.entities.Order.update(orderId, {
      driver_id: nearest.user_id,
      status: 'driver_assigned',
      distance_km: distance
    });

    return Response.json({
      driver_id: nearest.user_id,
      distance_km: distance
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}