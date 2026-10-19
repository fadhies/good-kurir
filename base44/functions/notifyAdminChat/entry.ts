import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { createNotification } from '../../shared/notify.ts';

// Notifikasi chat langsung admin-driver (di luar pesanan). Dipicu dari
// frontend setelah pesan tersimpan: pesan admin memberi tahu driver,
// pesan driver memberi tahu semua admin (lonceng + push tray HP).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { driverId, text } = await req.json();
    if (!driverId || !text) {
      return Response.json({ error: 'driverId & text required' }, { status: 400 });
    }

    const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;

    if (user.role === 'admin') {
      // Admin mengirim: beri tahu driver yang bersangkutan.
      if (driverId === user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await createNotification(base44, {
        user_id: driverId,
        type: 'new_message',
        title: '💬 Pesan dari Admin',
        body: preview,
        // Ketukan push tray HP membuka menu Bantuan driver (chat admin).
        action_url: 'https://ojekta.com/driver/bantuan',
      });
      return Response.json({ success: true, notified: 1 });
    }

    // Driver hanya boleh memicu notifikasi untuk chatnya sendiri.
    if (driverId !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter((u) => u.role === 'admin');
    await Promise.all(
      admins.map((a) =>
        createNotification(base44, {
          user_id: a.id,
          type: 'new_message',
          title: '💬 Pesan dari Driver',
          body: preview,
          // Ketukan notifikasi admin membuka langsung chat dengan driver ini.
          driver_id: user.id,
          action_url: `https://ojekta.com/admin/driver?chat=${user.id}`,
        })
      )
    );
    return Response.json({ success: true, notified: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}