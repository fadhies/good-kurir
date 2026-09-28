import React from "react";
import { Camera, Crosshair, Loader2, MapPin } from "lucide-react";
import { Image } from "@/components/ui/image";

function UploadCard({ title, sub, photo, uploading, onPick }) {
  return (
    <label
      className={`w-full flex items-center gap-3 border rounded-2xl p-4 text-left cursor-pointer transition-colors ${
        photo ? "border-emerald-600 bg-emerald-50/50" : "border-slate-200 bg-white hover:border-emerald-500"
      }`}
    >
      {photo ? (
        <Image src={photo} alt={title} className="w-16 h-16 rounded-xl shrink-0" fittingType="fill" />
      ) : (
        <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </span>
      )}
      <span className="min-w-0">
        <b className="block text-sm text-slate-900">{title}</b>
        <small className="block text-[11px] text-slate-500">
          {photo ? "Ketuk untuk ganti foto" : sub}
        </small>
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </label>
  );
}

export default function DriverStepDokumen({ data, onUpload, uploading, onUseLocation, locating }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Dokumen & Lokasi</h2>
        <p className="text-xs text-slate-500 mt-0.5">Siapkan KTP dan aktifkan lokasi Anda</p>
      </div>
      <div className="space-y-3">
        <UploadCard
          title="Foto KTP"
          sub="Unggah foto KTP Anda"
          photo={data.ktpPhoto}
          uploading={uploading === "ktp"}
          onPick={(f) => onUpload("ktp", f)}
        />
        <UploadCard
          title="Foto Selfie dengan KTP"
          sub="Ambil selfie sambil memegang KTP"
          photo={data.selfiePhoto}
          uploading={uploading === "selfie"}
          onPick={(f) => onUpload("selfie", f)}
        />
        <div className="border border-slate-200 rounded-3xl p-4 bg-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <b className="text-sm text-slate-900">Lokasi Awal Beroperasi</b>
          </div>
          <p
            className={`text-xs mt-1.5 break-words ${
              data.location ? "text-slate-700" : "text-slate-400"
            }`}
          >
            {data.location ? data.location.address : "Belum ditentukan"}
          </p>
          <button
            type="button"
            onClick={onUseLocation}
            className="mt-3 w-full min-h-[44px] rounded-2xl border border-emerald-600/30 bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
            {data.location ? "Perbarui lokasi saya" : "Gunakan lokasi saya"}
          </button>
        </div>
      </div>
    </div>
  );
}