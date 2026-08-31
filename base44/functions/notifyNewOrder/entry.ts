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

    const typeLabel =
      order.type === 'food' ? 'Beli Makanan' :
      order.type === 'goods' ? 'Antar Barang' : 'Antar Orang';

    await Promise.all(
      drivers.map((d) =>
        createNotification(base44, {
          user_id: d.user_id,
          type: 'new_order',
          title: `Orderan baru: ${typeLabel}`,
          body: order.store_name ? `Dari ${order.store_name}` : 'Pesanan baru masuk',
          order_id: orderId,
        })
      )
    );

    return Response.json({ success: true, notified: drivers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}