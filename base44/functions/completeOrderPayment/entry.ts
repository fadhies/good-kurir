import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createNotification } from '../../shared/notify.ts';

const ADMIN_FEE = 2000;

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
    if (order.driver_id !== user.id && order.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.status !== 'on_the_way') {
      return Response.json({ error: 'Pesanan belum dalam perjalanan' }, { status: 400 });
    }

    const deliveryFee = order.delivery_fee || 0;
    const itemCost = order.item_cost || 0;
    const method = order.payment_method || 'cash';
    const isDirect = !!order.store_qris_photo; // user bayar langsung ke toko, ongkir tunai
    const total = itemCost + deliveryFee;

    // Hitung pergerakan dompet driver sesuai skema pembayaran
    let driverCredit = 0;
    let driverDebit = 0;
    let driverEarning = 0;

    if (method === 'qris') {
      if (order.type === 'food' && isDirect) {
        // User bayar tagihan toko langsung ke toko via QRIS. Ongkir tunai ke driver saat tiba.
        // Tidak ada dana pindah ke dompet driver.
        driverCredit = 0;
        driverDebit = 0;
        driverEarning = deliveryFee;
      } else if (order.type === 'food' && !isDirect) {
        // Talangi: user bayar tagihan toko + ongkir via QRIS → dompet driver, dipotong fee admin.
        driverCredit = itemCost + deliveryFee;
        driverDebit = ADMIN_FEE;
        driverEarning = itemCost + deliveryFee - ADMIN_FEE;
      } else {
        // goods/person QRIS: ongkir via QRIS → dompet driver, dipotong fee admin.
        driverCredit = deliveryFee;
        driverDebit = ADMIN_FEE;
        driverEarning = deliveryFee - ADMIN_FEE;
      }
    } else {
      // cash: ongkir tunai ke driver, fee admin dipotong dari dompet.
      driverCredit = 0;
      driverDebit = ADMIN_FEE;
      driverEarning = deliveryFee - ADMIN_FEE;
    }

    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'completed',
      app_fee: 0,
      admin_fee: driverDebit,
      driver_earning: driverEarning,
      total_amount: total,
    });

    // Temukan admin untuk menerima fee
    let adminId = null;
    if (driverDebit > 0) {
      try {
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, 'created_date', 1);
        adminId = admins[0]?.id || null;
      } catch {}
    }

    if (order.driver_id) {
      if (driverCredit > 0) {
        await base44.asServiceRole.entities.WalletTransaction.create({
          user_id: order.driver_id,
          type: 'credit',
          amount: driverCredit,
          description: `Pembayaran QRIS pesanan #${String(orderId).slice(-6)}`,
          order_id: orderId,
        });
      }
      if (driverDebit > 0) {
        await base44.asServiceRole.entities.WalletTransaction.create({
          user_id: order.driver_id,
          type: 'debit',
          amount: driverDebit,
          description: `Fee admin order #${String(orderId).slice(-6)}`,
          order_id: orderId,
        });
      }
    }

    // Fee masuk ke dompet admin
    if (adminId && driverDebit > 0) {
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_id: adminId,
        type: 'credit',
        amount: driverDebit,
        description: `Fee admin dari order #${String(orderId).slice(-6)}`,
        order_id: orderId,
      });
    }

    // Notifikasi ke pemilik & driver: pesanan selesai
    await createNotification(base44, {
      user_id: order.created_by_id,
      type: 'order_completed',
      title: 'Pesanan selesai',
      body: 'Pesanan Anda telah selesai. Terima kasih!',
      order_id: orderId,
    });
    if (order.driver_id) {
      const driverMsg = (method === 'qris' && order.type === 'food' && isDirect)
        ? 'Ongkir diterima tunai dari pelanggan.'
        : (method === 'qris' ? 'Pembayaran QRIS masuk ke dompet Anda.' : 'Ongkir diterima tunai.');
      await createNotification(base44, {
        user_id: order.driver_id,
        type: 'order_completed',
        title: 'Pesanan selesai',
        body: driverMsg,
        order_id: orderId,
      });
    }

    return Response.json({
      success: true,
      total_amount: total,
      driver_earning: driverEarning,
      admin_fee: driverDebit,
      method,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}