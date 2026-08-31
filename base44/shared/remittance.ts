import { makassarDateKey, makassarToday } from './date.ts';
import { selectQuery } from './supabase.ts';

// Kembalikan daftar tanggal (YYYY-MM-DD, lampau, sebelum hari ini) yang punya
// order completed milik driver tapi belum ada setoran (DriverRemittance non-rejected).
export async function getUnsettledDates(base44, userId) {
  const today = makassarToday();
  const completed = await selectQuery('orders', {
    filter: { driver_id: userId, status: 'completed' },
    order: '-updated_date',
    limit: 500
  });
  const remittances = await base44.asServiceRole.entities.DriverRemittance.filter({ user_id: userId });
  const settled = new Set(remittances.filter((r) => r.status !== 'rejected').map((r) => r.date));
  const dates = new Set();
  for (const o of completed) {
    const d = makassarDateKey(new Date(o.updated_date));
    if (d < today) dates.add(d);
  }
  return [...dates].filter((d) => !settled.has(d)).sort();
}

// Kembalikan Set berisi user_id driver yang sedang diblokir (ada hari lampau belum disetor).
export async function getBlockedDriverIds(base44, userIds) {
  if (!userIds || !userIds.length) return new Set();
  const today = makassarToday();
  const idSet = new Set(userIds);
  const completed = await selectQuery('orders', { filter: { status: 'completed' }, order: '-updated_date', limit: 500 });
  const remittances = await base44.asServiceRole.entities.DriverRemittance.filter({}, '-created_date', 500);

  const settledByUser = {};
  for (const r of remittances) {
    if (r.status === 'rejected' || !idSet.has(r.user_id)) continue;
    if (!settledByUser[r.user_id]) settledByUser[r.user_id] = new Set();
    settledByUser[r.user_id].add(r.date);
  }
  const datesByUser = {};
  for (const o of completed) {
    if (!o.driver_id || !idSet.has(o.driver_id)) continue;
    const d = makassarDateKey(new Date(o.updated_date));
    if (d < today) {
      if (!datesByUser[o.driver_id]) datesByUser[o.driver_id] = new Set();
      datesByUser[o.driver_id].add(d);
    }
  }
  const blocked = new Set();
  for (const uid of userIds) {
    const dates = datesByUser[uid];
    if (!dates) continue;
    const settled = settledByUser[uid] || new Set();
    for (const d of dates) {
      if (!settled.has(d)) { blocked.add(uid); break; }
    }
  }
  return blocked;
}