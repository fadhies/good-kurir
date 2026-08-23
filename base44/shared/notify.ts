export async function createNotification(base44, { user_id, type, title, body, order_id }) {
  if (!user_id || !type || !title) return;
  try {
    await base44.asServiceRole.entities.Notification.create({
      user_id,
      type,
      title,
      body: body || "",
      order_id: order_id || null,
      is_read: false,
    });
  } catch (e) {
    // best-effort; jangan gagalkan operasi utama
  }
}