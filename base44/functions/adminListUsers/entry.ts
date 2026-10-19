import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Daftar pengguna untuk halaman admin. Sesi yang dibuat sebelum akun
// dipromosikan ke admin (undangan) masih membawa peran lama di token, sehingga
// pemanggilan User.list() langsung dari frontend ditolak RLS. Di sini peran
// diverifikasi dari record User (sumber kebenaran), bukan dari token.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin') {
      try {
        const rec = await base44.entities.User.get(user.id);
        if (rec?.role === 'admin') user = { ...user, role: 'admin' };
      } catch (_e) { /* pertahankan peran dari token */ }
    }
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const users = await base44.asServiceRole.entities.User.list();
    return Response.json({ ok: true, data: users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}