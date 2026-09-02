import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import S from "@/lib/supabaseEntities";

// True bila user ini adalah driver yang sudah diverifikasi (approved).
// Membaca dari Supabase (S.DriverProfile) agar konsisten dengan data yang
// diubah admin di AdminDrivers. Re-fetch saat tab kembali aktif supaya
// status terbaru (mis. baru disetujui admin) langsung terdeteksi.
export function useIsDriver() {
  const { user } = useAuth();
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    async function check() {
      try {
        const list = await S.DriverProfile.filter({ user_id: user.id });
        if (active) setIsDriver(list.some((p) => p.verification_status === "approved"));
      } catch {
        if (active) setIsDriver(false);
      }
    }

    check();

    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", check);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", check);
    };
  }, [user?.id]);

  return isDriver;
}