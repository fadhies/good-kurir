import { insertOne } from './supabase.ts';

// Creates a notification row directly in Supabase (service_role bypasses RLS).
// Best-effort: never throws, so it can't fail the calling operation.
export async function createNotification(_base44, { user_id, type, title, body, order_id }) {
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
}