import { base44 } from "@/api/base44Client";

// Daftar pengguna untuk halaman admin: diambil lewat fungsi backend
// `adminListUsers` yang memverifikasi peran admin dari record akun, bukan dari
// token sesi (sesi admin undangan bisa membawa peran lama di token).
function unwrap(r) {
  if (r && r.data && r.data.ok) return r.data.data;
  throw new Error((r && r.data && r.data.error) || "Gagal memuat daftar pengguna");
}

export async function listAdminUsers() {
  return unwrap(await base44.functions.invoke("adminListUsers", {}));
}