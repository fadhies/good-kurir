import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createNotification } from '../../shared/notify.ts';
import { getById } from '../../shared/supabase.ts';

// Membuat notifikasi (ke lonceng) untuk pihak yang tidak melakukan aksi saat
// driver mengubah status pesanan. Dijalankan dari frontend setelah S.Order.update
// karena RLS Notification melarang driver membuat notifikasi untuk user lain.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId, status } = body;
    if (!orderId || !status) {
      return Response.json({ error: 'orderId & status required' }, { status: 400 });
    }

    const order = await getById('orders', orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    // Hanya driver pesanan (atau admin) yang boleh memicu notifikasi status ini.
    if (order.driver_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ownerId = order.created_by_id;
    const typeLabel =
      order.type === 'food' ? 'Beli Makanan' :
      order.type === 'goods' ? 'Antar Barang' : 'Antar Orang';

    const notifs = [];
    if (status === 'at_store') {
      if (ownerId) {
        notifs.push({
          user_id: ownerId,
          type: 'order_accepted',
          title: 'Driver sudah tiba di lokasi',
          body: order.type === 'person'
            ? 'Driver sudah sampai di lokasi jemput. Silakan tunggu.'
            : order.type === 'goods'
            ? 'Driver sudah sampai di lokasi ambil barang.'
            : 'Driver sudah sampai di toko/restoran.',
          order_id: orderId,
        });
      }
    } else if (status === 'awaiting_payment') {
      if (ownerId) {
        const total = (order.item_cost || 0) + (order.delivery_fee || 0) + (order.service_fee || 0);
        notifs.push({
          user_id: ownerId,
          type: 'order_accepted',
          title: 'Tagihan dikirim driver',
          body: `Total tagihan Rp${Number(total).toLocaleString('id-ID')}. Silakan lakukan pembayaran sekarang.`,
          order_id: orderId,
        });
      }
    } else if (status === 'on_the_way') {
      if (ownerId) {
        notifs.push({
          user_id: ownerId,
          type: 'order_accepted',
          title: 'Driver dalam perjalanan',
          body: order.type === 'person'
            ? 'Driver sedang mengantar Anda ke tujuan.'
            : 'Pesanan menuju tujuan Anda.',
          order_id: orderId,
        });
      }
    } else if (status === 'paid') {
      // User membayar → notifikasi ke driver
      if (order.driver_id) {
        notifs.push({
          user_id: order.driver_id,
          type: 'payment_received',
          title: 'Bukti pembayaran diterima',
          body: 'User sudah bayar. Silakan antar ke tujuan.',
          order_id: orderId,
        });
      }
    }

    await Promise.all(notifs.map((n) => createNotification(base44, n)));
    return Response.json({ success: true, notified: notifs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}