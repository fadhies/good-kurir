// Pesan foto disimpan pada kolom `text` chat dengan awalan IMG:: diikuti
// file_uri (penyimpanan privat), sehingga tidak perlu menambah kolom tabel.
export const IMG_PREFIX = "IMG::";

export function isImageMessage(text) {
  return typeof text === "string" && text.startsWith(IMG_PREFIX);
}

export function imageUriOf(text) {
  return isImageMessage(text) ? text.slice(IMG_PREFIX.length) : null;
}

// Teks ringkas untuk daftar percakapan & notifikasi.
export function chatPreview(text) {
  return isImageMessage(text) ? "📷 Foto" : text;
}