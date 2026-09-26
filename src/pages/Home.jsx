import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import PullToRefresh from "@/components/PullToRefresh";
import S from "@/lib/supabaseEntities";
import HomeTopBar from "@/components/home/HomeTopBar";
import HomeHero from "@/components/home/HomeHero";
import ServiceGrid from "@/components/home/ServiceGrid";
import PromoCard from "@/components/home/PromoCard";
import CourierCta from "@/components/home/CourierCta";

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "user";
  const [driverProfile, setDriverProfile] = useState(null);

  async function loadDriver() {
    if (!user?.id) return;
    try {
      const list = await S.DriverProfile.filter({ user_id: user.id });
      setDriverProfile(list[0] || null);
    } catch {
      setDriverProfile(null);
    }
  }

  useEffect(() => {
    loadDriver();
  }, [user?.id]);

  return (
    <div className="min-h-[100dvh] bg-[#eef8f2]">
      <div
        className="max-w-[430px] mx-auto bg-white min-h-[100dvh] md:my-6 md:min-h-0 md:rounded-[30px] md:shadow-[0_20px_70px_rgba(0,83,56,0.16)] px-[18px] pb-28 [font-family:'Poppins',_sans-serif] text-[#10243a]"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <HomeTopBar />
        <PullToRefresh onRefresh={loadDriver}>
          <HomeHero firstName={user?.full_name?.split(" ")[0] || "Sobat"} />
          <ServiceGrid />
          <PromoCard />
          {role === "user" && <CourierCta driverProfile={driverProfile} />}
          <div className="mt-10 text-center">
            <Link
              to="/privacy"
              className="text-xs text-[#667085] underline underline-offset-2 hover:text-[#079447]"
            >
              Kebijakan Privasi
            </Link>
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}