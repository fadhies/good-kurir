import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function DriverRegisterSuccess({ onViewStatus }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mb-5">
        <CheckCircle2 className="w-11 h-11" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">Pendaftaran Berhasil!</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-xs">
        Data kamu sedang kami verifikasi. Hasilnya akan dikirim melalui aplikasi.
      </p>
      <div className="w-full max-w-xs border border-slate-200 rounded-3xl p-4 mt-6 bg-white text-left">
        <b className="text-xs text-slate-500 block">Estimasi proses</b>
        <p className="text-sm font-bold text-slate-900 mt-1">1-2 hari kerja</p>
      </div>
      <button
        onClick={onViewStatus}
        className="mt-6 w-full max-w-xs min-h-[52px] rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform"
      >
        Lihat Status Pendaftaran
      </button>
    </div>
  );
}