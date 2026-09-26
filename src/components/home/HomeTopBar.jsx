import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import NotificationBell from "@/components/NotificationBell";
import ProfileMenu from "@/components/ProfileMenu";

export default function HomeTopBar() {
  return (
    <div className="h-[76px] flex items-center justify-between shrink-0">
      <Link to="/" aria-label="OjekTa Beranda" className="flex items-center gap-[7px]">
        <Image
          src="https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/622adcb21_LogoAplikasi.png"
          alt="Logo OjekTa"
          className="w-16 h-16 object-contain"
          fittingType="fit"
        />
        <span className="grid leading-[0.9] text-[#10243a]">
          <b className="text-[27px] font-extrabold leading-none">OjekTa</b>
          <strong className="text-[17px] font-bold leading-none">Bulukumba</strong>
          <small className="text-[9px] text-[#387468] mt-1">Ojeknya Kita-Kita</small>
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </div>
  );
}