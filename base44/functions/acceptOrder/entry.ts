import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { haversineKm } from '../../shared/geo.ts';
import { createNotification } from '../../shared/notify.ts';
import { getUnsettledDates } from '../../shared/remittance.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.DriverProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profil driver tidak ditemukan' }, { status: 404 });
    if (profile.verification_status !== 'approved') {
      return Response.json({ error: 'Akun belum diverifikasi admin' }, { status: 403 });
    }
    if (!profile.is_online) {
      return Response.json({ error: 'Anda sedang offline' }, { status: 400 });
    }
    if (profile.current_lat == null || profile.current_lng == null) {
      return Response.json({ error: 'Atur lokasi Anda dulu' }, { status: 400 });
    }

    // Blokir driver yang belum setor (fee layanan + Rp1.000/transaksi) untuk hari lampau.
    const unsettled = await getUnsettledDates(base44, user.id);
    if (unsettled.length > 0) {
      return Response.json({
        error: `Anda belum setor fee layanan untuk transaksi tanggal ${unsettled.join(', ')}. Selesaikan setoran di menu Dompet untuk menerima pesanan baru.`,
      }, { status: 403 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) return Response.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    if (order.status !== 'pending_match') {
      return Response.json({ error: 'Pesanan sudah diambil driver lain' }, { status: 409 });
    }

    const mode = order.mode || 'hemat';
    const MAX_HEMAT = 3;

    const activeOrders = await base44.asServiceRole.entities.Order.filter({
      driver_id: user.id,
      status: { $in: ['driver_assigned', 'at_store', 'awaiting_payment', 'paid', 'on_the_way'] }
    });
    const activeCount = activeOrders.length;
    const activeHematCount = activeOrders.filter((o) => (o.mode || 'hemat') === 'hemat').length;
    if (mode === 'cepat' ? activeCount !== 0 : activeHematCount >= MAX_HEMAT) {
      return Response.json({ error: 'Anda sudah mencapai batas orderan aktif' }, { status: 400 });
    }

    const distance = Math.round(haversineKm(order.store_lat, order.store_lng, profile.current_lat, profile.current_lng) * 100) / 100;

    await base44.asServiceRole.entities.Order.update(orderId, {
      driver_id: user.id,
      status: 'driver_assigned',
      distance_km: distance
    });

    const updated = await base44.asServiceRole.entities.Order.get(orderId);
    if (updated.driver_id !== user.id) {
      return Response.json({ error: 'Pesanan sudah diambil driver lain' }, { status: 409 });
    }

    await createNotification(base44, {
      user_id: order.created_by_id,
      type: 'order_accepted',
      title: 'Driver menerima pesanan Anda',
      body: 'Driver sedang menuju lokasi.',
      order_id: orderId,
    });

    return Response.json({ success: true, driver_id: user.id, distance_km: distance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}