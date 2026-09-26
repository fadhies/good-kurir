import React from "react";
import { Link } from "react-router-dom";
import { UserRoundPlus, ChevronRight } from "lucide-react";

export default function CourierCta({ driverProfile }) {
  const status = driverProfile?.verification_status;
  return (
    <section className="grid grid-cols-[45px_1fr_auto] gap-2.5 items-center p-3.5 border border-[#eef3f0] rounded-[20px] shadow-[0_8px_20px_rgba(34,83,62,0.08)]">
      <span className="w-[42px] h-[42px] rounded-full bg-[#dbf8dc] text-[#07884a] grid place-items-center">
        <UserRoundPlus className="w-5 h-5" />
      </span>
      <div>
        <b className="font-bold leading-[1.25] block text-[#10243a] text-sm">
          {status === "pending" ?
          "Pendaftaran Anda sedang diverifikasi admin." :
          status === "approved" ?
          "Anda sudah terdaftar sebagai kurir OjekTa." :
          status === "rejected" ?
          "Pendaftaran kurir Anda ditolak." :
          "Semua bisa jadi kurir, semua bisa jadi pelanggan!"}
        </b>
        <small className="text-[#667085] text-xs block leading-tight mt-0">Yuk, mulai perjalanan bersama OjekTa.</small>
      </div>
      {driverProfile ?
      <span className="bg-[#f1f5f3] text-[#667085] rounded-[17px] px-3 py-2.5 text-[9px] font-semibold whitespace-nowrap">
          {status === "pending" ? "Menunggu Verifikasi" : status === "approved" ? "Sudah Terdaftar" : "Ditolak"}
        </span> :

      <Link
        to="/jadi-driver"
        className="bg-[#f1faf5] text-[#07935b] rounded-[17px] px-3 py-2.5 font-semibold flex items-center whitespace-nowrap text-xs">
        
          Daftar Kurir <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      }
    </section>);

}