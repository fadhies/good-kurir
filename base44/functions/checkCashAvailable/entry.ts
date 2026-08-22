import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { walletBalancesByUser } from '../../shared/wallet.ts';

const SERVICE_FEE = 2000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({
      is_online: true
    });

    if (!drivers.length) {
      return Response.json({ available: false });
    }

    const balances = await walletBalancesByUser(
      base44,
      drivers.map((d) => d.user_id)
    );

    const available = drivers.some((d) => (balances[d.user_id] || 0) >= SERVICE_FEE);
    return Response.json({ available });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}