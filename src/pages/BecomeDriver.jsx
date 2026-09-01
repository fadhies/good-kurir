import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import LocationPicker from "@/components/GoogleLocationPicker";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { Bike, Loader2, CheckCircle2, Crosshair, CreditCard, Camera } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { compressImage } from "@/lib/compressImage";

export default function BecomeDriver() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState("motorcycle");
  const [plate, setPlate] = useState("");
  const [location, setLocation] = useState(null);
  const [phone, setPhone] = useState("");
  const [ktpPhoto, setKtpPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleUpload(file, key, setter) {
    if (!file) return;
    setUploading(key);
    try {
      const compressed = await compressImage(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      setter(file_url);
    } catch (e) {
      toast({ title: "Gagal upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Geolokasi tidak didukung", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await res.json();
          setLocation({ lat: latitude, lng: longitude, address: data.display_name });
        } catch {
          setLocation({ lat: latitude, lng: longitude, address: `${latitude}, ${longitude}` });
        }
      },
      () => toast({ title: "Tidak bisa mengakses lokasi", variant: "destructive" })
    );
  }

  async function handleSubmit() {
    if (!plate) {
      toast({ title: "Isi plat nomor kendaraan", variant: "destructive" });
      return;
    }
    if (!location) {
      toast({ title: "Tentukan lokasi Anda", variant: "destructive" });
      return;
    }
    if (!ktpPhoto) {
      toast({ title: "Upload foto KTP", variant: "destructive" });
      return;
    }
    if (!selfiePhoto) {
      toast({ title: "Upload selfie sambil memegang KTP", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (phone) {
        await base44.auth.updateMe({ phone });
      }
      const payload = {
        vehicle_type: vehicle,
        license_plate: plate,
        is_online: true,
        is_available: true,
        current_lat: location.lat,
        current_lng: location.lng,
        current_address: location.address,
        ktp_photo: ktpPhoto,
        selfie_with_ktp: selfiePhoto,
      };
      const existing = await S.DriverProfile.filter({ user_id: user.id });
      if (existing.length > 0) {
        // Sudah ada profil — perbarui, jangan buat duplikat. Reset ke pending
        // hanya jika sebelumnya ditolak (pengajuan ulang).
        await S.DriverProfile.update(existing[0].id, {
          ...payload,
          verification_status: existing[0].verification_status === "rejected" ? "pending" : existing[0].verification_status,
        });
      } else {
        await S.DriverProfile.create({ user_id: user.id, ...payload, verification_status: "pending" });
      }
      toast({ title: "Pendaftaran terkirim", description: "Menunggu verifikasi admin sebelum bisa menerima pesanan." });
      navigate("/driver");
    } catch (e) {
      toast({ title: "Gagal mendaftar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold">Daftar Jadi Driver</h1>
          <p className="text-muted-foreground text-sm">Mulai dapat penghasilan antar makanan, barang & orang.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
          <div>
            <label className="text-sm font-semibold mb-2 block">Kendaraan</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "motorcycle", l: "Motor" },
                { v: "car", l: "Mobil" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setVehicle(o.v)}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm ${
                    vehicle === o.v ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Plat Nomor</label>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="B 1234 XX"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Nomor HP</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Nomor ini harus terhubung ke akun Dana yang aktif untuk menerima pembayaran dari pelanggan.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Lokasi Anda Sekarang</label>
              <button
                onClick={useMyLocation}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Crosshair className="w-3.5 h-3.5" /> Gunakan lokasi saya
              </button>
            </div>
            <LocationPicker label="Posisi driver" value={location} onChange={setLocation} accent="158 64% 30%" />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Foto KTP</label>
            <label className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors min-h-[8rem]">
              {ktpPhoto ? (
                <Image src={ktpPhoto} alt="KTP" className="w-full h-32 rounded-lg" fittingType="fill" />
              ) : uploading === "ktp" ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <>
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center">Ketuk untuk unggah foto KTP</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0], "ktp", setKtpPhoto)}
              />
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Selfie Sambil Memegang KTP</label>
            <label className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors min-h-[8rem]">
              {selfiePhoto ? (
                <Image src={selfiePhoto} alt="Selfie KTP" className="w-full h-32 rounded-lg" fittingType="fill" />
              ) : uploading === "selfie" ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center">Ketuk untuk unggah selfie + KTP</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0], "selfie", setSelfiePhoto)}
              />
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Daftar Sekarang
          </button>
        </div>
      </div>
    </Layout>
  );
}