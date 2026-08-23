import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId, text } = body || {};
    if (!orderId || !text) return Response.json({ error: 'orderId dan text wajib' }, { status: 400 });

    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: 'Order tidak ditemukan' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isParticipant = order.created_by_id === user.id || order.driver_id === user.id;
    if (!isParticipant && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!order.driver_id) {
      return Response.json({ error: 'Driver belum ditetapkan' }, { status: 400 });
    }

    const participants = [order.created_by_id, order.driver_id].filter(Boolean);
    const senderRole = isAdmin ? 'admin' : (order.created_by_id === user.id ? 'user' : 'driver');

    const created = await base44.asServiceRole.entities.ChatMessage.create({
      order_id: orderId,
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      sender_role: senderRole,
      text: String(text).slice(0, 1000),
      participants,
    });

    return Response.json({ success: true, message: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}