import { makassarDateKey, makassarToday } from './date.ts';
import { selectQuery } from './supabase.ts';

// Bangun peta order_id -> tanggal selesai (stabil). Tanggal selesai pakai
// created_date wallet_transaction credit, yang dibuat sekali saat order selesai
// (completeOrderPayment) dan tidak pernah diubah — sehingga tidak ikut ter-bump
// saat user memberi rating (yang menggeser orders.updated_date ke hari ini).
function buildCompletedAt(rows) {
  const map = {};
  for (const w of rows) {
    if (w.order_id && !map[w.order_id]) map[w.order_id] = w.created_date;
  }
  return map;
}

// Kembalikan daftar tanggal (YYYY-MM-DD, lampau, sebelum hari ini) yang punya
// order completed milik driver tapi belum ada setoran (DriverRemittance non-rejected).
export async function getUnsettledDates(base44, userId) {
  const today = makassarToday();
  const [completed, remittances, wts] = await Promise.all([
    selectQuery('orders', {
      filter: { driver_id: userId, status: 'completed' },
      order: '-updated_date',
      limit: 500
    }),
    selectQuery('driver_remittances', { filter: { user_id: userId }, limit: 1000 }),
    selectQuery('wallet_transactions', { filter: { user_id: userId, type: 'credit' }, order: '-created_date', limit: 500 })
  ]);
  const completedAt = buildCompletedAt(wts);
  const settled = new Set(remittances.filter((r) => r.status !== 'rejected').map((r) => r.date));
  const dates = new Set();
  for (const o of completed) {
    const d = makassarDateKey(new Date(completedAt[o.id] || o.updated_date));
    if (d < today) dates.add(d);
  }
  return [...dates].filter((d) => !settled.has(d)).sort();
}

// Kembalikan Set berisi user_id driver yang sedang diblokir (ada hari lampau belum disetor).
export async function getBlockedDriverIds(base44, userIds) {
  if (!userIds || !userIds.length) return new Set();
  const today = makassarToday();
  const idSet = new Set(userIds);
  const [completed, remittances, wts] = await Promise.all([
    selectQuery('orders', { filter: { status: 'completed' }, order: '-updated_date', limit: 500 }),
    selectQuery('driver_remittances', { order: '-created_date', limit: 500 }),
    selectQuery('wallet_transactions', { filter: { type: 'credit' }, order: '-created_date', limit: 1000 })
  ]);
  const completedAt = buildCompletedAt(wts);

  const settledByUser = {};
  for (const r of remittances) {
    if (r.status === 'rejected' || !idSet.has(r.user_id)) continue;
    if (!settledByUser[r.user_id]) settledByUser[r.user_id] = new Set();
    settledByUser[r.user_id].add(r.date);
  }
  const datesByUser = {};
  for (const o of completed) {
    if (!o.driver_id || !idSet.has(o.driver_id)) continue;
    const d = makassarDateKey(new Date(completedAt[o.id] || o.updated_date));
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