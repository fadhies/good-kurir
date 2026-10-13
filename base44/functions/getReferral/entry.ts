import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ensureReferralCode } from '../../shared/referral.ts';
import { selectQuery } from '../../shared/supabase.ts';

// Data area referal user: kode + daftar referal & kupon miliknya.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const code = await ensureReferralCode(user.id);
    const [referrals, coupons] = await Promise.all([
      selectQuery('referrals', { filter: { referrer_user_id: user.id }, order: '-created_date', limit: 50 }),
      selectQuery('coupons', { filter: { user_id: user.id }, order: '-created_date', limit: 50 }),
    ]);

    return Response.json({
      ok: true,
      code,
      referrals,
      coupons,
      stats: {
        invited: referrals.length,
        rewarded: referrals.filter((r) => r.status === 'rewarded').length,
        coupons_available: coupons.filter((c) => c.status === 'unused').length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}