import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import FavoritePlacesChips from "@/components/home/FavoritePlacesChips";

export default function HomeHero({ firstName, userId, variant = "mobile" }) {
  const navigate = useNavigate();
  const startOrder = () => navigate("/pesan?type=person");
  const desktop = variant === "desktop";

  return (
    <section
      className={
        desktop
          ? "relative overflow-hidden rounded-[32px] h-full min-h-[460px] p-8 text-white bg-[linear-gradient(112deg,#007b64_0%,#02864f_43%,#8bd540_100%)] flex flex-col"
          : "relative overflow-hidden rounded-[32px] h-[290px] p-6 mt-3 text-white bg-[linear-gradient(112deg,#007b64_0%,#02864f_43%,#8bd540_100%)]"
      }>
      
      <p className={desktop ? "font-semibold text-base" : "font-semibold text-sm"}>Halo, {firstName}! 👋</p>
      <h1 className={desktop ?
        "leading-[1.05] font-extrabold tracking-tight mt-3 mb-3 text-4xl" :
        "leading-[1.04] font-extrabold tracking-tight mt-2 mb-2 text-xl"}>
        Mau ke mana<br />hari ini?
      </h1>
      <div className={desktop ? "text-sm leading-[1.6]" : "text-xs leading-[1.5]"}>
        Jalan lebih mudah, aktivitas lebih dekat<br />bersama OjekTa Bulukumba.
      </div>

      {desktop ? (
        <>
          <button
            onClick={startOrder}
            className="mt-auto z-20 h-[56px] rounded-[20px] bg-white grid grid-cols-[35px_1fr_30px] items-center px-5 text-left text-[#667085] shadow-[0_12px_30px_rgba(21,87,55,0.18)] hover:shadow-[0_16px_36px_rgba(21,87,55,0.25)] transition-shadow">
            
            <MapPin className="w-5 h-5 text-[#079447]" />
            <span className="text-sm font-medium truncate">Mau dijemput di mana hari ini?</span>
            <Search className="w-[18px] h-[18px] text-[#086b5d]" />
          </button>

          <div className="z-20 mt-5 overflow-x-auto scrollbar-hide">
            <FavoritePlacesChips userId={userId} />
          </div>
        </>
      ) : (
        <>
          <button
            onClick={startOrder}
            className="absolute z-20 left-5 right-5 top-[160px] h-[48px] rounded-[19px] bg-white grid grid-cols-[35px_1fr_30px] items-center px-4 text-left text-[#667085] shadow-[0_12px_30px_rgba(21,87,55,0.12)]">
            
            <MapPin className="w-5 h-5 text-[#079447]" />
            <span className="text-xs font-medium truncate">Mau dijemput di mana hari ini?</span>
            <Search className="w-[18px] h-[18px] text-[#086b5d]" />
          </button>

          <div className="absolute z-20 left-5 right-5 bottom-[19px] overflow-x-auto scrollbar-hide">
            <FavoritePlacesChips userId={userId} />
          </div>
        </>
      )}
    </section>
  );
}