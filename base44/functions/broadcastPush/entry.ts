import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Broadcast push ke semua pengguna aplikasi. Hanya admin yang boleh mengirim.
// Pengiriman memakai SendPushNotification (service role, server-side).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (!title || !content) {
      return Response.json({ error: 'Judul dan isi pesan wajib diisi' }, { status: 400 });
    }
    if (title.length > 100 || content.length > 500) {
      return Response.json({ error: 'Judul maks 100 karakter, isi maks 500 karakter' }, { status: 400 });
    }

    // Ambil semua pengguna (User entity hanya mendukung list() tanpa opsi).
    const users = await base44.asServiceRole.entities.User.list();
    const targets = users.filter((u) => u.id !== user.id);

    // Kirim per batch 6 secara paralel, catat hasil tiap pengguna.
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < targets.length; i += 6) {
      const batch = targets.slice(i, i + 6);
      const results = await Promise.allSettled(
        batch.map((u) =>
          base44.asServiceRole.integrations.Core.SendPushNotification({
            user_id: u.id,
            title,
            content,
          })
        )
      );
      for (const r of results) {
        if (r.status === 'fulfilled') sent++;
        else {
          failed++;
          console.error('push gagal:', r.reason?.message || r.reason);
        }
      }
    }

    return Response.json({ ok: true, total: targets.length, sent, failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}