// Helper tanggal zona Asia/Makassar (UTC+8). Format 'YYYY-MM-DD' agar bisa
// dibandingkan secara leksikal untuk menentukan hari ini / hari kemarin.
export function makassarDateKey(date?: Date | string | number): string {
  const d = date ? new Date(date) : new Date();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(d);
}

export function makassarToday(): string {
  return makassarDateKey(new Date());
}