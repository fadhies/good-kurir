import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function deleteAccount(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const categories = Array.isArray(body?.categories) ? body.categories : ['orders', 'driver', 'wallet'];

    const sr = base44.asServiceRole;
    const result = {};

    if (categories.includes('orders')) {
      await sr.entities.Order.deleteMany({ created_by_id: user.id });
      await sr.entities.Order.deleteMany({ driver_id: user.id });
      result.orders = true;
    }
    if (categories.includes('driver')) {
      await sr.entities.DriverProfile.deleteMany({ user_id: user.id });
      result.driver = true;
    }
    if (categories.includes('wallet')) {
      await sr.entities.WalletTransaction.deleteMany({ user_id: user.id });
      result.wallet = true;
    }

    return Response.json({ ok: true, purged: categories });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}