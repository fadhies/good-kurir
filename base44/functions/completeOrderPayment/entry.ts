import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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
    const method = order.payment_method || 'cash';
    const total = (order.item_cost || 0) + deliveryFee;
    const driverEarning = Math.max(0, deliveryFee - ADMIN_FEE);

    // Temukan admin untuk menerima fee (admin pertama / terlama)
    let adminId = null;
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, 'created_date', 1);
      adminId = admins[0]?.id || null;
    } catch {}

    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'completed',
      app_fee: 0,
      admin_fee: ADMIN_FEE,
      driver_earning: driverEarning,
      total_amount: total,
    });

    if (order.driver_id) {
      if (method === 'qris') {
        // Midtrans escrow: user paid item_cost ke rekening app, driver bayar toko tunai → reimburse
        if (order.midtrans_paid && order.type === 'food' && (order.item_cost || 0) > 0) {
          await base44.asServiceRole.entities.WalletTransaction.create({
            user_id: order.driver_id,
            type: 'credit',
            amount: order.item_cost,
            description: `Reimburse tagihan toko #${String(orderId).slice(-6)}`,
            order_id: orderId,
          });
        }
        if (deliveryFee > 0) {
          await base44.asServiceRole.entities.WalletTransaction.create({
            user_id: order.driver_id,
            type: 'credit',
            amount: deliveryFee,
            description: `Ongkir order #${String(orderId).slice(-6)}`,
            order_id: orderId,
          });
        }
      }
      // Fee admin dipotong dari dompet driver
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_id: order.driver_id,
        type: 'debit',
        amount: ADMIN_FEE,
        description: `Fee admin order #${String(orderId).slice(-6)}`,
        order_id: orderId,
      });
    }

    // Fee masuk ke dompet admin
    if (adminId) {
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_id: adminId,
        type: 'credit',
        amount: ADMIN_FEE,
        description: `Fee admin dari order #${String(orderId).slice(-6)}`,
        order_id: orderId,
      });
    }

    return Response.json({
      success: true,
      total_amount: total,
      driver_earning: driverEarning,
      admin_fee: ADMIN_FEE,
      method,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}