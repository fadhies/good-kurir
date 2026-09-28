import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import S from "@/lib/supabaseEntities";
import { base44 } from "@/api/base44Client";
import { compressImage } from "@/lib/compressImage";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import DriverSteps from "@/components/driver/DriverSteps";
import DriverIntro from "@/components/driver/DriverIntro";
import DriverStepDataDiri from "@/components/driver/DriverStepDataDiri";
import DriverStepKendaraan from "@/components/driver/DriverStepKendaraan";
import DriverStepDokumen from "@/components/driver/DriverStepDokumen";
import DriverRegisterSuccess from "@/components/driver/DriverRegisterSuccess";
import DriverStatus from "@/components/driver/DriverStatus";

const EMPTY = {
  name: "",
  birthDate: "",
  phone: "",
  danaSame: true,
  danaNumber: "",
  vehicle: "motorcycle",
  plate: "",
  ktpPhoto: null,
  selfiePhoto: null,
  location: null,
};

export default function BecomeDriver() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  // intro | form | success | status
  const [phase, setPhase] = useState("intro");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [locating, setLocating] = useState(false);
  const [data, setData] = useState(EMPTY);

  const patch = (p) => setData((d) => ({ ...d, ...p }));

  // Muat profil driver yang ada: pending/approved → layar status,
  // rejected → layar status dengan opsi daftar ulang (form terisi otomatis).
  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    (async () => {
      try {
        const rows = await S.DriverProfile.filter({ user_id: user.id });
        const p = rows[0] || null;
        if (!active) return;
        setProfile(p);
        if (p && (p.verification_status === "pending" || p.verification_status === "approved")) {
          setPhase("status");
        } else {
          if (p) {
            patch({
              name: p.full_name || user.full_name || "",
              birthDate: p.birth_date || "",
              phone: user.phone || "",
              danaNumber: p.dana_number || "",
              danaSame: !p.dana_number || p.dana_number === user.phone,
              vehicle: p.vehicle_type || "motorcycle",
              plate: p.license_plate || "",
              ktpPhoto: p.ktp_photo || null,
              selfiePhoto: p.selfie_with_ktp || null,
              location:
                p.current_lat != null
                  ? { lat: p.current_lat, lng: p.current_lng, address: p.current_address }
                  : null,
            });
          } else {
            patch({ name: user.full_name || "", phone: user.phone || "" });
          }
          if (p && p.verification_status === "rejected") setPhase("status");
        }
      } catch {
        // profil belum bisa dibaca — biarkan mulai dari awal
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  async function handleUpload(key, file) {
    if (!file) return;
    setUploading(key);
    try {
      const compressed = await compressImage(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      patch(key === "ktp" ? { ktpPhoto: file_url } : { selfiePhoto: file_url });
    } catch (e) {
      toast({ title: "Gagal upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Geolokasi tidak didukung", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude}, ${longitude}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "id" } }
          );
          const d = await res.json();
          if (d.display_name) address = d.display_name;
        } catch {}
        patch({ location: { lat: latitude, lng: longitude, address } });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast({ title: "Tidak bisa mengakses lokasi", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function next() {
    if (step === 1) {
      if (!data.name.trim()) return toast({ title: "Isi nama lengkap dulu", variant: "destructive" });
      if (!data.phone.trim()) return toast({ title: "Isi nomor HP dulu", variant: "destructive" });
      if (!data.danaSame && !data.danaNumber.trim())
        return toast({ title: "Isi nomor DANA dulu", variant: "destructive" });
    }
    if (step === 2 && !data.plate.trim())
      return toast({ title: "Isi plat nomor kendaraan", variant: "destructive" });
    if (step === 3) return submit();
    setStep(step + 1);
  }

  // Simpan profil; jika kolom baru (full_name/birth_date/dana_number) belum ada
  // di tabel Supabase, daftar tetap berhasil tanpa data tambahan itu.
  async function persist(payload) {
    const rows = await S.DriverProfile.filter({ user_id: user.id });
    const existing = rows[0];
    const save = (p) =>
      existing
        ? S.DriverProfile.update(existing.id, {
            ...p,
            verification_status:
              existing.verification_status === "rejected" ? "pending" : existing.verification_status,
          })
        : S.DriverProfile.create({ ...p, verification_status: "pending" });
    try {
      return await save(payload);
    } catch (e) {
      if (/full_name|birth_date|dana_number|PGRST204|42703/i.test(e.message || "")) {
        const p = { ...payload };
        delete p.full_name;
        delete p.birth_date;
        delete p.dana_number;
        return await save(p);
      }
      throw e;
    }
  }

  async function submit() {
    if (!data.ktpPhoto) return toast({ title: "Upload foto KTP dulu", variant: "destructive" });
    if (!data.selfiePhoto)
      return toast({ title: "Upload selfie dengan KTP dulu", variant: "destructive" });
    if (!data.location) return toast({ title: "Tentukan lokasi operasi Anda", variant: "destructive" });
    setSaving(true);
    try {
      if (data.phone && data.phone !== user.phone) {
        await base44.auth.updateMe({ phone: data.phone });
      }
      const dana = (data.danaSame ? data.phone : data.danaNumber).trim();
      await persist({
        user_id: user.id,
        full_name: data.name.trim(),
        birth_date: data.birthDate || null,
        dana_number: dana,
        vehicle_type: data.vehicle,
        license_plate: data.plate.trim(),
        ktp_photo: data.ktpPhoto,
        selfie_with_ktp: data.selfiePhoto,
        current_lat: data.location.lat,
        current_lng: data.location.lng,
        current_address: data.location.address,
        is_online: true,
        is_available: true,
      });
      setPhase("success");
    } catch (e) {
      toast({ title: "Gagal mendaftar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const startForm = () => {
    setStep(1);
    setPhase("form");
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto [font-family:'Poppins',_sans-serif]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : phase === "intro" ? (
          <DriverIntro onStart={startForm} />
        ) : phase === "status" ? (
          <DriverStatus profile={profile} onRetry={startForm} />
        ) : phase === "success" ? (
          <DriverRegisterSuccess onViewStatus={() => setPhase("status")} />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 grid place-items-center shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h1 className="text-base font-bold text-slate-900">Pendaftaran Driver</h1>
            </div>

            <DriverSteps step={step} />

            {step === 1 && <DriverStepDataDiri data={data} onChange={patch} email={user?.email || ""} />}
            {step === 2 && <DriverStepKendaraan data={data} onChange={patch} />}
            {step === 3 && (
              <DriverStepDokumen
                data={data}
                onUpload={handleUpload}
                uploading={uploading}
                onUseLocation={useMyLocation}
                locating={locating}
              />
            )}

            <button
              onClick={next}
              disabled={saving}
              className="mt-6 w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                </>
              ) : (
                <>
                  Lanjutkan <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <div className="h-16" />
          </>
        )}
      </div>
    </Layout>
  );
}