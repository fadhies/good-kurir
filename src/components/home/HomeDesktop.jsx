import React from "react";
import { Link } from "react-router-dom";
import HomeTopBar from "@/components/home/HomeTopBar";
import HomeHero from "@/components/home/HomeHero";
import ServiceGrid from "@/components/home/ServiceGrid";
import PromoCard from "@/components/home/PromoCard";
import CourierCta from "@/components/home/CourierCta";

// Tata letak beranda untuk tablet (landscape) dan desktop:
// hero di kiri, layanan + promo + kurir di kolom kanan.
export default function HomeDesktop({ user, driverProfile }) {
  return (
    <div className="max-w-6xl mx-auto px-8 py-8 [font-family:'Poppins',_sans-serif] text-[#10243a]">
      <div className="bg-white rounded-[30px] border border-[#eef3f0] shadow-[0_20px_70px_rgba(0,83,56,0.16)] p-8">
        <HomeTopBar />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mt-6 items-stretch">
          <HomeHero
            firstName={user?.full_name?.split(" ")[0] || "Sobat"}
            userId={user?.id}
            variant="desktop" />

          <div className="flex flex-col gap-4">
            <div className="border border-[#eef3f0] rounded-[23px] px-4 py-2 shadow-[0_8px_20px_rgba(34,83,62,0.08)]">
              <ServiceGrid variant="desktop" />
            </div>
            <PromoCard />
            <CourierCta driverProfile={driverProfile} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/privacy"
            className="text-xs text-[#667085] underline underline-offset-2 hover:text-[#079447]">
            Kebijakan Privasi
          </Link>
        </div>
      </div>
    </div>
  );
}