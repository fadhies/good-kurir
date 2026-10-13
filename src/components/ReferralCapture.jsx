import React, { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

const KEY = "ojekta_ref_code";

// Menangkap tautan referal (?ref=KODE) di halaman mana pun: simpan kodenya
// di localStorage, lalu klaim saat pengguna berhasil masuk/daftar.
export default function ReferralCapture() {
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let ref = params.get("ref");
    if (!ref) {
      // Bila peluncuran dari Play Store membawa parameter atribusi
      // (referrer=utm_source%3Dreferral%26ref%3DKODE), ambil kodenya dari sana.
      const referrer = params.get("referrer");
      if (referrer) ref = new URLSearchParams(referrer).get("ref");
    }
    if (ref && ref.trim()) {
      try {
        localStorage.setItem(KEY, ref.trim().toUpperCase());
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let code = null;
    try {
      code = localStorage.getItem(KEY);
    } catch {}
    if (!code) return;
    base44.functions
      .invoke("claimReferral", { code })
      .catch(() => {})
      .finally(() => {
        try {
          localStorage.removeItem(KEY);
        } catch {}
      });
  }, [user?.id]);

  return null;
}