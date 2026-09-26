import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Home as HouseIcon, Briefcase, Plus } from "lucide-react";

const QUICK_LOCATIONS = [
  { label: "Rumah", icon: HouseIcon },
  { label: "Kantor", icon: Briefcase },
  { label: "Tambah Lokasi", icon: Plus }
];

export default function HomeHero({ firstName }) {
  const navigate = useNavigate();
  const startOrder = () => navigate("/pesan?type=person");

  return (
    <section className="relative overflow-hidden rounded-[32px] h-[362px] p-6 text-white bg-[linear-gradient(112deg,#007b64_0%,#02864f_43%,#8bd540_100%)]">
      <p className="font-semibold text-sm">Halo, {firstName}! 👋</p>
      <h1 className="text-[38px] leading-[1.04] font-extrabold tracking-tight mt-2 mb-2">
        Mau ke mana<br />hari ini?
      </h1>
      <div className="text-xs leading-[1.5]">
        Jalan lebih mudah, aktivitas lebih dekat<br />bersama OjekTa Bulukumba.
      </div>

      <button
        onClick={startOrder}
        className="absolute z-20 left-5 right-5 top-[220px] h-[58px] rounded-[19px] bg-white grid grid-cols-[35px_1fr_30px] items-center px-4 text-left text-[#667085] shadow-[0_12px_30px_rgba(21,87,55,0.12)]"
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
              className="rounded-[22px] px-[13px] py-2.5 bg-white/90 backdrop-blur text-[#174539] flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap"
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