import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createNotification } from '../../shared/notify.ts';
import { getById, updateById, insertOne } from '../../shared/supabase.ts';

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
    if (order.driver_id !== user.id && order.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.status !== 'on_the_way') {
      return Response.json({ error: 'Pesanan belum dalam perjalanan' }, { status: 400 });
    }

    const deliveryFee = order.delivery_fee || 0;
    const itemCost = order.item_cost || 0;
    const serviceFee = order.service_fee || 0;
    // Total yang dibayar user = tagihan toko (food) + ongkir + fee layanan.
    const total = itemCost + deliveryFee + serviceFee;

    // Dompet driver bertambah sesuai TOTAL yang dibayar user (tunai maupun non tunai),
    // tanpa potongan apa pun. Setoran fee ke admin dilakukan driver terpisah via QRIS.
    await updateById('orders', orderId, {
      status: 'completed',
      app_fee: 0,
      admin_fee: 0,
      driver_earning: total,
      total_amount: total,
    });

    if (order.driver_id) {
      const wtId = crypto.randomUUID();
      const wtNow = new Date().toISOString();
      await insertOne('wallet_transactions', {
        id: wtId,
        created_date: wtNow,
        updated_date: wtNow,
        created_by_id: user.id,
        user_id: order.driver_id,
        type: 'credit',
        amount: total,
        description: `Pembayaran pesanan #${String(orderId).slice(-6)} (ongkir + fee layanan${order.type === 'food' ? ' + tagihan toko' : ''})`,
        order_id: orderId,
      });
    }

    await createNotification(base44, {
      user_id: order.created_by_id,
      type: 'order_completed',
      title: 'Pesanan selesai',
      body: 'Pesanan Anda telah selesai. Terima kasih!',
      order_id: orderId,
    });
    if (order.driver_id) {
      await createNotification(base44, {
        user_id: order.driver_id,
        type: 'order_completed',
        title: 'Pesanan selesai',
        body: `Pendapatan Rp${total.toLocaleString('id-ID')} masuk ke dompet. Jangan lupa setor fee layanan + Rp1.000/transaksi ke admin via QRIS di menu Dompet.`,
        order_id: orderId,
      });
    }

    return Response.json({
      success: true,
      total_amount: total,
      driver_earning: total,
      method: order.payment_method || 'cash',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}