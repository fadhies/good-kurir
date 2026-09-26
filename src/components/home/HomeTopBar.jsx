import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import NotificationBell from "@/components/NotificationBell";
import ProfileMenu from "@/components/ProfileMenu";

export default function HomeTopBar() {
  return (
    <div className="h-[76px] flex items-center justify-between shrink-0">
      <Link to="/" aria-label="OjekTa Beranda" className="flex items-center">
        <div className="h-[64px] w-[220px]">
          <Image
            src="https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/bad1deb81_LogoSosmed2.png"
            alt="Logo OjekTa Bulukumba"
            className="w-full h-full"
            fittingType="fit"
          />
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </div>
  );
}