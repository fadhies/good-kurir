import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getBlockedDriverIds } from '../../shared/remittance.ts';

// Pembayaran tunai kini tidak lagi butuh saldo dompet (tidak ada potongan dompet
// per transaksi). Yang dicek: ada driver online & verified yang tidak sedang
// diblokir karena belum setor harian.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({
      verification_status: 'approved',
      is_online: true,
    });

    if (!drivers.length) return Response.json({ available: false });

    const blocked = await getBlockedDriverIds(base44, drivers.map((d) => d.user_id));
    const available = drivers.some((d) =>
      !blocked.has(d.user_id) && d.current_lat != null && d.current_lng != null
    );
    return Response.json({ available });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}