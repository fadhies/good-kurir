import { selectQuery } from './supabase.ts';

// Menghitung saldo dompet per user dari riwayat WalletTransaction (Supabase).
export async function walletBalancesByUser(_base44, userIds) {
  const balances = {};
  if (!userIds || !userIds.length) return balances;
  const txs = await selectQuery('wallet_transactions', {
    filter: { user_id: { $in: userIds } },
    limit: 1000,
  });
  for (const t of txs) {
    const cur = balances[t.user_id] || 0;
    balances[t.user_id] = cur + (t.type === 'credit' ? t.amount : -t.amount);
  }
  return balances;
}