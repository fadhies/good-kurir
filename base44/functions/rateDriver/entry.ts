import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId, rating } = body;
    if (!orderId || !rating) return Response.json({ error: 'orderId & rating required' }, { status: 400 });

    const stars = Math.max(1, Math.min(5, Math.round(Number(rating))));

    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.created_by_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (order.status !== 'completed') return Response.json({ error: 'Pesanan belum selesai' }, { status: 400 });
    if (!order.driver_id) return Response.json({ error: 'Tidak ada driver' }, { status: 400 });
    if (order.user_rating) return Response.json({ error: 'Sudah memberi rating' }, { status: 400 });

    await base44.asServiceRole.entities.Order.update(orderId, { user_rating: stars });

    // Hitung ulang rating & total trip driver dari order yang completed
    const driverOrders = await base44.asServiceRole.entities.Order.filter(
      { driver_id: order.driver_id, status: 'completed' },
      '-created_date',
      500
    );
    const rated = driverOrders.filter((o) => o.user_rating != null);
    const avg = rated.length ? rated.reduce((s, o) => s + o.user_rating, 0) / rated.length : 5;
    const trips = driverOrders.length;

    const profiles = await base44.asServiceRole.entities.DriverProfile.filter({ user_id: order.driver_id });
    if (profiles[0]) {
      await base44.asServiceRole.entities.DriverProfile.update(profiles[0].id, {
        rating: Math.round(avg * 10) / 10,
        total_trips: trips,
      });
    }

    return Response.json({ success: true, rating: stars });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}