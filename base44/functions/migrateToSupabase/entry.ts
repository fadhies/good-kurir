import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { upsertMany } from "../../shared/supabase.ts";

// One-time admin migration: copies existing Base44 records for the 6 moved
// entities into Supabase. Idempotent (upserts on primary key id). Run after the
// Supabase tables exist (see base44/shared/supabase-schema.sql).

const TABLES = {
  Order: { table: "Order", cols: ["id","created_date","updated_date","created_by_id","user_id","driver_id","type","mode","payment_method","store_name","store_address","store_detail","store_lat","store_lng","destination_address","destination_lat","destination_lng","destination_detail","notes","status","item_cost","delivery_fee","service_fee","driver_remit_fee","app_fee","admin_fee","driver_earning","total_amount","distance_km","store_bill_note","qris_photo","payment_proof_photo","store_qris_photo","driver_dana_number","user_rating","midtrans_paid"] },
  DriverProfile: { table: "DriverProfile", cols: ["id","created_date","updated_date","created_by_id","user_id","vehicle_type","license_plate","ktp_photo","selfie_with_ktp","verification_status","rejection_reason","is_online","is_available","current_lat","current_lng","current_address","rating","total_trips"] },
  DriverRemittance: { table: "DriverRemittance", cols: ["id","created_date","updated_date","created_by_id","user_id","date","amount","transaction_count","proof_photo","status","note"] },
  ChatMessage: { table: "ChatMessage", cols: ["id","created_date","updated_date","created_by_id","order_id","sender_id","sender_name","sender_role","text","participants"] },
  WalletTransaction: { table: "WalletTransaction", cols: ["id","created_date","updated_date","created_by_id","user_id","type","amount","description","order_id"] },
  Notification: { table: "Notification", cols: ["id","created_date","updated_date","created_by_id","user_id","type","title","body","order_id","is_read"] },
};

function pick(rec, cols) {
  const out = {};
  for (const c of cols) out[c] = rec[c] !== undefined ? rec[c] : null;
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin")
      return Response.json({ error: "Forbidden" }, { status: 403 });

    const sr = base44.asServiceRole;
    const result = {};

    for (const [entity, { table, cols }] of Object.entries(TABLES)) {
      const records = await sr.entities[entity].list("-created_date", 1000);
      const rows = records.map((r) => pick(r, cols));
      result[entity] = await upsertMany(table, rows);
    }

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}