import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { calcFees } from '../../shared/geo.ts';

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
    if (order.created_by_id !== user.id && order.driver_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const method = order.payment_method || 'cash';
    const deliveryFee = order.delivery_fee || 0;
    const { app_fee: appFee, admin_fee: adminFee, driver_earning: driverEarning } = calcFees(deliveryFee);
    const total = (order.item_cost || 0) + deliveryFee;

    if (method === 'cash') {
      // Tunai: driver menerima uang cash saat pesanan sampai.
      // Biaya layanan Rp2.000 dipotong dari dompet driver saat pesanan selesai.
      if (order.status !== 'on_the_way') {
        return Response.json({ error: 'Pesanan belum dalam perjalanan' }, { status: 400 });
      }
      await base44.asServiceRole.entities.Order.update(orderId, {
        status: 'completed',
        app_fee: appFee,
        admin_fee: adminFee,
        driver_earning: driverEarning,
        total_amount: total
      });
      if (order.driver_id) {
        await base44.asServiceRole.entities.WalletTransaction.create({
          user_id: order.driver_id,
          type: 'debit',
          amount: appFee + adminFee,
          description: `Biaya layanan (tunai) order #${String(orderId).slice(-6)}`,
          order_id: orderId
        });
      }
      return Response.json({
        success: true,
        total_amount: total,
        driver_earning: driverEarning,
        app_fee: appFee,
        admin_fee: adminFee,
        method: 'cash'
      });
    }

    // Non-tunai (gopay/dana/qris): penghasilan masuk ke dompet driver.
    if (order.status !== 'awaiting_payment') {
      return Response.json({ error: 'Pesanan belum siap dibayar' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'paid',
      app_fee: appFee,
      admin_fee: adminFee,
      driver_earning: driverEarning,
      total_amount: total
    });

    if (order.driver_id && driverEarning > 0) {
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_id: order.driver_id,
        type: 'credit',
        amount: driverEarning,
        description: `Penghasilan order #${String(orderId).slice(-6)}`,
        order_id: orderId
      });
    }

    return Response.json({
      success: true,
      total_amount: total,
      driver_earning: driverEarning,
      app_fee: appFee,
      admin_fee: adminFee,
      method: 'non-cash'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}