// Utilitas untuk menutup aplikasi (khusus native Android/iOS via Capacitor/Cordova).
// Di browser biasa tidak bisa menutup tab; kembalikan false agar pemanggil menampilkan fallback.
export async function exitApp() {
  try {
    const Cap = typeof window !== "undefined" ? window.Capacitor : undefined;
    const appPlugin = Cap?.Plugins?.App || Cap?.App;
    if (appPlugin && typeof appPlugin.exitApp === "function") {
      await appPlugin.exitApp();
      return true;
    }
  } catch (_) {}
  try {
    if (typeof navigator !== "undefined" && navigator.app && typeof navigator.app.exitApp === "function") {
      navigator.app.exitApp();
      return true;
    }
  } catch (_) {}
  return false;
}