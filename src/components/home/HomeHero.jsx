import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { Image } from "@/components/ui/image";
import FavoritePlacesChips from "@/components/home/FavoritePlacesChips";

export default function HomeHero({ firstName, userId }) {
  const navigate = useNavigate();
  const startOrder = () => navigate("/pesan?type=person");

  return (
    <section className="relative overflow-hidden rounded-[32px] h-[290px] p-6 mt-3 text-white bg-[linear-gradient(112deg,#007b64_0%,#02864f_43%,#8bd540_100%)]">
      <p className="font-semibold text-sm">Halo, {firstName}! 👋</p>
      <h1 className="leading-[1.04] font-extrabold tracking-tight mt-2 mb-2 text-xl">
        Mau ke mana<br />hari ini?
      </h1>
      <div className="text-xs leading-[1.5]">
        Jalan lebih mudah, aktivitas lebih dekat<br />bersama OjekTa Bulukumba.
      </div>

      <div className="absolute top-0 right-0 h-[150px] w-[160px] overflow-hidden rounded-tr-[32px] pointer-events-none">
        <Image
          src="https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/5d7d2a09a_driverhero.png"
          alt="Driver OjekTa Bulukumba"
          className="w-full h-full"
        />
      </div>

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
    </section>
  );
}