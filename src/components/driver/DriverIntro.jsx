import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { Image } from "@/components/ui/image";

const LOGO = "https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/bad1deb81_LogoSosmed2.png";
const BENEFITS = ["Pendaftaran mudah", "Proses cepat", "Fleksibel atur waktu", "Dukungan tim OjekTa"];

export default function DriverIntro({ onStart }) {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center -mx-4 px-4 py-8 bg-[radial-gradient(circle_at_90%_10%,#b9edc8,transparent_35%),linear-gradient(145deg,#f7fffa,#e3f7eb)]">
      <div className="h-[110px] w-[220px] mx-auto">
        <Image src={LOGO} alt="OjekTa Bulukumba" className="w-full h-full" fittingType="fit" />
      </div>
      <p className="text-center text-xs font-bold tracking-widest text-emerald-700/70 uppercase mt-2">
        Ojeknya Kita-Kita
      </p>
      <h1 className="text-center text-3xl font-extrabold leading-tight mt-4 text-slate-900">
        Jadi Bagian dari
        <br />
        <span className="text-emerald-600">OjekTa Bulukumba</span>
      </h1>
      <p className="text-center text-sm text-slate-500 mt-3">
        Dapatkan penghasilan dengan mengantar orang, makanan, dan barang.
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 mt-7">
        {BENEFITS.map((b) => (
          <div
            key={b}
            className="flex items-center gap-2 bg-white/70 rounded-2xl px-3 py-2.5 border border-emerald-600/10"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white grid place-items-center shrink-0">
              <Check className="w-3 h-3" />
            </span>
            <b className="text-[11px] text-slate-800">{b}</b>
          </div>
        ))}
      </div>
      <button
        onClick={onStart}
        className="mt-8 w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        Mulai Daftar <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}