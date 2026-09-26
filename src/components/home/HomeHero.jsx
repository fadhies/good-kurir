import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Home as HouseIcon, Briefcase, Plus } from "lucide-react";
import { Image } from "@/components/ui/image";

const HERO_IMG = "https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/b22aeff37_hero-driver-reference.jpg";

const QUICK_LOCATIONS = [
  { label: "Rumah", icon: HouseIcon },
  { label: "Kantor", icon: Briefcase },
  { label: "Tambah Lokasi", icon: Plus }
];

export default function HomeHero({ firstName }) {
  const navigate = useNavigate();
  const startOrder = () => navigate("/pesan?type=person");

  return (
    <section className="relative overflow-hidden rounded-[32px] h-[362px] text-white">
      {/* Latar hero: foto driver + pemandangan Bulukumba */}
      <Image src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full" fittingType="fill" />
      {/* Scrim bawah agar kolom pencarian tetap terbaca */}
      <div className="absolute inset-x-0 bottom-0 h-[230px] bg-gradient-to-t from-[#1A4B3A]/90 via-[#1A4B3A]/40 to-transparent" />

      <p className="absolute left-6 top-6 z-10 text-sm font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
        Halo, {firstName}! 👋
      </p>

      <button
        onClick={startOrder}
        className="absolute z-20 left-5 right-5 top-[220px] h-[58px] rounded-[19px] bg-white grid grid-cols-[35px_1fr_30px] items-center px-4 text-left text-[#667085] shadow-[0_12px_30px_rgba(21,87,55,0.25)] active:scale-[0.98] transition-transform"
      >
        <MapPin className="w-5 h-5 text-[#079447]" />
        <span className="text-xs font-medium truncate">Mau dijemput di mana hari ini?</span>
        <Search className="w-[18px] h-[18px] text-[#086b5d]" />
      </button>

      <div className="absolute z-20 left-5 right-5 bottom-[19px] flex gap-2">
        {QUICK_LOCATIONS.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.label}
              onClick={startOrder}
              className="rounded-[22px] px-[13px] py-2.5 bg-white/90 backdrop-blur text-[#174539] flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap active:scale-95 transition-transform"
            >
              <Icon className="w-4 h-4 text-[#087c61]" />
              {q.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}