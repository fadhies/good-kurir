// Format tanggal zona Asia/Makassar (UTC+8) sebagai 'YYYY-MM-DD'
// agar bisa dibandingkan secara leksikal untuk menentukan hari ini / jatuh tempo.
export function makassarDateKey(date) {
  const d = date ? new Date(date) : new Date();
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(d);
}

export function makassarToday() {
  return makassarDateKey(new Date());
}