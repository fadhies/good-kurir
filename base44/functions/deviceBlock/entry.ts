import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { selectQuery, insertOne, deleteWhere } from '../../shared/supabase.ts';

// Pemblokiran perangkat (device_id) oleh admin. Pengguna masih bisa login,
// tetapi tindakan utama (membuat pesanan) ditolak untuk perangkat yang
// diblokir — sekalipun ia membuat akun baru di perangkat yang sama.

async function adminFromRequest(base44) {
  let user = await base44.auth.me();
  if (!user) return null;
  // Sesi lama bisa membawa role yang sudah tidak akurat; cek ulang User record.
  if (user.role !== 'admin') {
    try {
      const rec = await base44.entities.User.get(user.id);
      if (rec?.role === 'admin') user = { ...user, role: 'admin' };
    } catch (_e) { /* fall back ke me() role */ }
  }
  return user.role === 'admin' ? user : null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const op = body.op;

    // Pengecekan status: siapa pun yang login boleh mengecek perangkatnya.
    if (op === 'check') {
      const me = await base44.auth.me();
      if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const deviceId = String(body.deviceId || '').trim();
      if (!deviceId) return Response.json({ ok: true, data: { blocked: false } });
      const rows = await selectQuery('blocked_devices', { filter: { device_id: deviceId }, limit: 1 });
      return Response.json({ ok: true, data: { blocked: rows.length > 0, reason: rows[0]?.reason || null } });
    }

    const admin = await adminFromRequest(base44);
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (op === 'list') {
      const rows = await selectQuery('blocked_devices', { order: '-created_date', limit: 500 });
      return Response.json({ ok: true, data: rows });
    }

    if (op === 'block') {
      const deviceId = String(body.deviceId || '').trim();
      const reason = String(body.reason || '').trim();
      if (!deviceId) return Response.json({ error: 'deviceId required' }, { status: 400 });
      // Hanya perangkat yang pernah tercatat pada order yang boleh diblokir.
      const orderRows = await selectQuery('orders', { filter: { device_id: deviceId }, limit: 1 });
      if (!orderRows.length) {
        return Response.json({ error: 'Device ID tidak tercatat pada pesanan apa pun' }, { status: 400 });
      }
      // Hapus duplikat lama (jika ada) lalu simpan blokir terbaru.
      await deleteWhere('blocked_devices', { device_id: deviceId });
      const row = await insertOne('blocked_devices', {
        id: crypto.randomUUID(),
        device_id: deviceId,
        reason: reason || 'Melanggar ketentuan aplikasi',
        created_date: new Date().toISOString(),
        created_by_id: admin.id,
      });
      return Response.json({ ok: true, data: row });
    }

    if (op === 'unblock') {
      const deviceId = String(body.deviceId || '').trim();
      if (!deviceId) return Response.json({ error: 'deviceId required' }, { status: 400 });
      await deleteWhere('blocked_devices', { device_id: deviceId });
      return Response.json({ ok: true, data: { device_id: deviceId } });
    }

    return Response.json({ error: 'Unknown op' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}