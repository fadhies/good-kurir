import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { insertOne, getById as sbGet, updateById as sbUpdate } from '../../shared/supabase.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Hanya admin' }, { status: 403 });

    const body = await req.json();
    const { request_id, action, transfer_proof_photo, rejection_reason } = body;
    if (!request_id) return Response.json({ error: 'request_id required' }, { status: 400 });
    if (!['complete', 'reject'].includes(action)) {
      return Response.json({ error: 'action tidak valid' }, { status: 400 });
    }

    const wr = await sbGet('withdrawal_requests', request_id);
    if (!wr) return Response.json({ error: 'Permintaan tidak ditemukan' }, { status: 404 });
    if (wr.status !== 'pending') return Response.json({ error: 'Permintaan sudah diproses' }, { status: 400 });

    if (action === 'complete') {
      if (!transfer_proof_photo) {
        return Response.json({ error: 'Bukti transfer wajib diunggah' }, { status: 400 });
      }
      await sbUpdate('withdrawal_requests', request_id, {
        status: 'completed',
        transfer_proof_photo,
        processed_by_id: user.id,
        updated_date: new Date().toISOString(),
      });
      return Response.json({ success: true, status: 'completed' });
    }

    // Tolak: kembalikan saldo ke driver
    await sbUpdate('withdrawal_requests', request_id, {
      status: 'rejected',
      rejection_reason: rejection_reason || null,
      processed_by_id: user.id,
      updated_date: new Date().toISOString(),
    });
    const wtId = crypto.randomUUID();
    const wtNow = new Date().toISOString();
    await insertOne('wallet_transactions', {
      id: wtId,
      created_date: wtNow,
      updated_date: wtNow,
      created_by_id: user.id,
      user_id: wr.user_id,
      type: 'credit',
      amount: wr.amount,
      description: `Refund penarikan ditolak (${wr.bank_name} ${String(wr.account_number).slice(-4)})`,
      order_id: request_id,
    });
    return Response.json({ success: true, status: 'rejected' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}