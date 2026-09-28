import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const btnPrimary =
  "w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform";
const btnSecondary =
  "w-full min-h-[48px] rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm active:scale-[0.98] transition-transform";

export default function DriverStatus({ profile, onRetry }) {
  const navigate = useNavigate();
  const status = profile?.verification_status || "pending";

  const cfg =
    status === "approved"
      ? {
          icon: CheckCircle2,
          cls: "bg-emerald-100 text-emerald-600",
          title: "Akun Driver Aktif",
          desc: "Selamat! Akun driver Anda sudah aktif dan siap menerima pesanan.",
        }
      : status === "rejected"
      ? {
          icon: XCircle,
          cls: "bg-rose-100 text-rose-600",
          title: "Pendaftaran Ditolak",
          desc: profile?.rejection_reason
            ? `Alasan: ${profile.rejection_reason}`
            : "Periksa kembali data dan dokumen Anda, lalu daftar ulang.",
        }
      : {
          icon: Clock,
          cls: "bg-amber-100 text-amber-500",
          title: "Sedang Diverifikasi",
          desc: "Data sudah kami terima. Kami akan memberikan kabar melalui notifikasi.",
        };

  const Icon = cfg.icon;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className={`w-20 h-20 rounded-full grid place-items-center mb-5 ${cfg.cls}`}>
        <Icon className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">{cfg.title}</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-xs break-words">{cfg.desc}</p>

      {status === "pending" && (
        <div className="w-full max-w-xs border border-slate-200 rounded-3xl p-4 mt-6 bg-white text-left space-y-3">
          <p className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Data pendaftaran diterima
          </p>
          <p className="flex items-center gap-2 text-xs text-amber-600 font-bold">
            <Clock className="w-4 h-4 shrink-0" /> Sedang diverifikasi
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 inline-block shrink-0" />
            Akun driver aktif
          </p>
        </div>
      )}

      <div className="mt-6 w-full max-w-xs space-y-2">
        {status === "approved" && (
          <button onClick={() => navigate("/driver")} className={btnPrimary}>
            Buka Dashboard Driver
          </button>
        )}
        {status === "rejected" && (
          <>
            <button onClick={onRetry} className={btnPrimary}>
              Daftar Ulang
            </button>
            <button onClick={() => navigate("/")} className={btnSecondary}>
              Kembali ke Beranda
            </button>
          </>
        )}
        {status === "pending" && (
          <button onClick={() => navigate("/")} className={btnPrimary}>
            Kembali ke Beranda
          </button>
        )}
      </div>
    </div>
  );
}