import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { insertOne, selectQuery } from '../../shared/supabase.ts';

const MIN_REMAINING = 10000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { amount, bank_name, account_number, account_holder_name } = body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return Response.json({ error: 'Nominal tidak valid' }, { status: 400 });
    if (!bank_name || !account_number) {
      return Response.json({ error: 'Bank & nomor rekening wajib diisi' }, { status: 400 });
    }

    // Hitung saldo dompet saat ini (dari Supabase)
    const txs = await selectQuery('wallet_transactions', { filter: { user_id: user.id }, limit: 1000 });
    const balance = txs.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0);
    if (balance - amt < MIN_REMAINING) {
      return Response.json({ error: `Saldo minimum tersisa Rp${MIN_REMAINING.toLocaleString('id-ID')}` }, { status: 400 });
    }

    // Buat permintaan penarikan
    const wr = await base44.asServiceRole.entities.WithdrawalRequest.create({
      user_id: user.id,
      amount: amt,
      bank_name,
      account_number: String(account_number),
      account_holder_name: account_holder_name || null,
      status: 'pending',
    });

    // Potong dompet (dicadangkan)
    const wtId = crypto.randomUUID();
    const wtNow = new Date().toISOString();
    await insertOne('wallet_transactions', {
      id: wtId,
      created_date: wtNow,
      updated_date: wtNow,
      created_by_id: user.id,
      user_id: user.id,
      type: 'debit',
      amount: amt,
      description: `Penarikan ke ${bank_name} ${String(account_number).slice(-4)}`,
      order_id: wr.id,
    });

    return Response.json({ success: true, request_id: wr.id, balance: balance - amt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}