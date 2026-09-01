import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createNotification } from '../../shared/notify.ts';
import { getById, selectQuery } from '../../shared/supabase.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

    const order = await getById('orders', orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    // Hanya pembuat order yang sah boleh memicu notifikasi driver
    if (order.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const drivers = await selectQuery('driver_profiles', {
      filter: { verification_status: 'approved', is_online: true, is_available: true },
      limit: 1000
    });

    // Filter driver sesuai aturan kapasitas yang dipakai kartu "Pesanan
    // Tersedia" di DriverDashboard, supaya notifikasi hanya dikirim ke driver
    // yang benar-benar bisa menerima pesanan ini:
    //  - mode cepat: driver harus sedang kosong (0 order aktif)
    //  - mode hemat: driver boleh membawa < 3 order hemat aktif
    const ACTIVE_STATUSES = ['driver_assigned', 'at_store', 'awaiting_payment', 'paid', 'on_the_way'];
    const activeOrders = drivers.length
      ? await selectQuery('orders', {
          filter: { driver_id: { $in: drivers.map((d) => d.user_id) }, status: { $in: ACTIVE_STATUSES } },
          limit: 1000,
        })
      : [];
    const activeCountByDriver = new Map();
    const activeHematCountByDriver = new Map();
    for (const o of activeOrders) {
      activeCountByDriver.set(o.driver_id, (activeCountByDriver.get(o.driver_id) || 0) + 1);
      if (o.mode === 'hemat') {
        activeHematCountByDriver.set(o.driver_id, (activeHematCountByDriver.get(o.driver_id) || 0) + 1);
      }
    }
    const eligibleDrivers = drivers.filter((d) => {
      const total = activeCountByDriver.get(d.user_id) || 0;
      const hemat = activeHematCountByDriver.get(d.user_id) || 0;
      if (order.mode === 'cepat') return total === 0;
      return hemat < 3;
    });

    const typeLabel =
      order.type === 'food' ? 'Beli Makanan' :
      order.type === 'goods' ? 'Antar Barang' : 'Antar Orang';

    await Promise.all(
      eligibleDrivers.map((d) =>
        createNotification(base44, {
          user_id: d.user_id,
          type: 'new_order',
          title: `Orderan baru: ${typeLabel}`,
          body: order.store_name ? `Dari ${order.store_name}` : 'Pesanan baru masuk',
          order_id: orderId,
        })
      )
    );

    return Response.json({ success: true, notified: eligibleDrivers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}