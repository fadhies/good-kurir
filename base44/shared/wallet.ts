// Menghitung saldo dompet per user dari riwayat WalletTransaction.
export async function walletBalancesByUser(base44, userIds) {
  const balances = {};
  if (!userIds || !userIds.length) return balances;
  const txs = await base44.asServiceRole.entities.WalletTransaction.filter({
    user_id: { $in: userIds }
  });
  for (const t of txs) {
    const cur = balances[t.user_id] || 0;
    balances[t.user_id] = cur + (t.type === 'credit' ? t.amount : -t.amount);
  }
  return balances;
}