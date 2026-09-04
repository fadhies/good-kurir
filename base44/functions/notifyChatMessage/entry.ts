import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createNotification } from '../../shared/notify.ts';
import { getById } from '../../shared/supabase.ts';

// Dipicu dari frontend setelah pesan chat tersimpan. Menyimpan notifikasi
// (lonceng) DAN mengirim push ke notification tray HP penerima, karena RLS
// melarang pengirim membuat notifikasi untuk user lain.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, text } = await req.json();
    if (!orderId || !text) {
      return Response.json({ error: 'orderId & text required' }, { status: 400 });
    }

    const order = await getById('orders', orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    // Hanya peserta pesanan (atau admin) yang boleh memicu notifikasi chat.
    const isParticipant = order.created_by_id === user.id || order.driver_id === user.id;
    if (!isParticipant && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const senderLabel =
      order.created_by_id === user.id
        ? 'Pelanggan'
        : order.driver_id === user.id
        ? 'Driver'
        : 'Admin';
    const preview =
      text.length > 60 ? text.slice(0, 60) + '…' : text;

    // Kirim ke semua peserta lain (user &/atau driver).
    const recipients = [order.created_by_id, order.driver_id]
      .filter(Boolean)
      .filter((id) => id !== user.id);

    await Promise.all(
      recipients.map((userId) =>
        createNotification(base44, {
          user_id: userId,
          type: 'new_message',
          title: `💬 Pesan dari ${senderLabel}`,
          body: preview,
          order_id: orderId,
        })
      )
    );

    return Response.json({ success: true, notified: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}