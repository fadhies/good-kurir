import { insertOne } from './supabase.ts';

// Creates a notification row directly in Supabase (service_role bypasses RLS),
// then sends a native mobile push (FCM/APNs) to the recipient's device.
// Best-effort: never throws, so it can't fail the calling operation.
export async function createNotification(base44, { user_id, type, title, body, order_id }) {
  if (!user_id || !type || !title) return;
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await insertOne('notifications', {
      id,
      created_date: now,
      updated_date: now,
      created_by_id: user_id,
      user_id,
      type,
      title,
      body: body || '',
      order_id: order_id || null,
      is_read: false,
    });
  } catch {
    // best-effort; jangan gagalkan operasi utama
  }
  // Kirim push ke notification tray HP (butuh native build + FCM credentials).
  try {
    await base44.asServiceRole.integrations.Core.SendPushNotification({
      user_id,
      title,
      content: body || title,
      action_label: order_id ? 'Lihat' : undefined,
      action_url: order_id ? `https://ojol-kita.base44.app/pesanan/${order_id}` : undefined,
    });
  } catch {
    // push gagal (mis. belum ada native build / device) — jangan gagalkan
  }
}