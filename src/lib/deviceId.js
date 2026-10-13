// Pengenal perangkat yang persisten (localStorage) untuk promo 3 order
// pertama. Bukan data pribadi — hanya ID acak yang dibuat sekali lalu dipakai
// ulang lintas sesi dan lintas jenis layanan.
const KEY = "ojekta_device_id";

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = (typeof crypto !== "undefined" && crypto.randomUUID) ?
        crypto.randomUUID() :
        `d-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}