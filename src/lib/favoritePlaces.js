// Penyimpanan alamat tujuan favorit untuk layanan antar orang — per akun, di perangkat ini.
const keyFor = (userId) => `ojekta_fav_places_${userId || "guest"}`;

export function loadFavorites(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFavorites(userId, list) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(list));
  } catch {}
}