import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Broadcast push ke semua pengguna aplikasi. Hanya admin yang boleh mengirim.
// Pengiriman memakai SendPushNotification (service role, server-side).
// Laporan: hanya hasil berstatus "sent" yang dihitung terkirim; kegagalan
// dicatat per pengguna beserta alasannya agar bisa ditelusuri admin.
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

    // Kirim satu per satu dengan jeda antar permintaan supaya tidak menabrak
    // rate limit layanan push. Bila tetap ditolak karena rate limit, permintaan
    // diulang otomatis dengan jeda yang makin panjang.
    const DELAY_MS = 250;
    const MAX_ATTEMPTS = 3;
    const RETRY_BASE_MS = 1500;
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const isRateLimit = (msg: string) => /rate limit|too many requests|429/i.test(msg);

    let sent = 0;
    let failed = 0;
    const failures = [];

    for (let i = 0; i < targets.length; i++) {
      const u = targets[i];
      if (i > 0) await sleep(DELAY_MS);

      let sentOk = false;
      let reason = 'unknown error';

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const val = (await base44.asServiceRole.integrations.Core.SendPushNotification({
            user_id: u.id,
            title,
            content,
          })) || {};
          if (val.status === 'sent') {
            sentOk = true;
          } else {
            reason = `status: ${val.status || 'unknown'}${Array.isArray(val.failed_channels) && val.failed_channels.length ? ` (${val.failed_channels.join(', ')})` : ''}`;
          }
          break;
        } catch (err) {
          reason = err?.message || String(err);
          if (!isRateLimit(reason) || attempt === MAX_ATTEMPTS) break;
          await sleep(RETRY_BASE_MS * attempt);
        }
      }

      if (sentOk) {
        sent++;
      } else {
        failed++;
        failures.push({ user_id: u.id, email: u.email, reason });
        console.error(`push gagal untuk ${u.email}: ${reason}`);
      }
    }

    return Response.json({ ok: true, total: targets.length, sent, failed, failures });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}