import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createNotification } from '../../shared/notify.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId, proofPhoto } = body;
    if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.created_by_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (order.status !== 'awaiting_payment') {
      return Response.json({ error: 'Bukan dalam fase menunggu pembayaran' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'paid',
      payment_proof_photo: proofPhoto || null,
    });

    // Notifikasi ke driver: bukti pembayaran diterima
    if (order.driver_id) {
      const isTalangi = !order.store_qris_photo && order.driver_dana_number;
      await createNotification(base44, {
        user_id: order.driver_id,
        type: 'payment_received',
        title: isTalangi ? 'Transfer Dana diterima' : 'Bukti pembayaran diterima',
        body: isTalangi
          ? 'User telah transfer ke akun Dana Anda. Cek mutasi Dana, lalu antar pesanan ke tujuan.'
          : 'User sudah membayar. Silakan antar ke tujuan.',
        order_id: orderId,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}