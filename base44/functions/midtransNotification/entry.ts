import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { verifyMidtransSignature, isPaidStatus } from "../../shared/midtrans.ts";

// Webhook dari Midtrans (tanpa auth user). Validasi signature sebelum memproses.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      signature_key,
      fraud_status,
    } = body;

    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const valid = await verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );
    if (!valid) return Response.json({ error: "Invalid signature" }, { status: 401 });

    const realId = String(order_id).startsWith("ORDER-")
      ? String(order_id).slice(6)
      : String(order_id);

    if (isPaidStatus(transaction_status, fraud_status)) {
      const order = await base44.asServiceRole.entities.Order.get(realId);
      if (order && order.status === "awaiting_payment") {
        await base44.asServiceRole.entities.Order.update(realId, {
          status: "paid",
          midtrans_paid: true,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}