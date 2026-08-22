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

    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({
      is_online: true,
      is_available: true
    });

    if (!drivers.length) {
      return Response.json({ error: 'Belum ada driver tersedia saat ini' }, { status: 404 });
    }

    let nearest = null;
    let minDist = Infinity;
    for (const d of drivers) {
      if (d.current_lat == null || d.current_lng == null) continue;
      const dist = haversineKm(order.store_lat, order.store_lng, d.current_lat, d.current_lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = d;
      }
    }

    if (!nearest) {
      return Response.json({ error: 'Tidak ada driver dengan lokasi aktif' }, { status: 404 });
    }

    const distance = Math.round(minDist * 100) / 100;

    await base44.asServiceRole.entities.Order.update(orderId, {
      driver_id: nearest.user_id,
      status: 'driver_assigned',
      distance_km: distance
    });
    await base44.asServiceRole.entities.DriverProfile.update(nearest.id, {
      is_available: false
    });

    return Response.json({
      driver_id: nearest.user_id,
      distance_km: distance
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}