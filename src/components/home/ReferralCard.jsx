import React from "react";
import { Link } from "react-router-dom";
import { Gift, ChevronRight } from "lucide-react";

// Kartu ajakan program referal di Beranda -> halaman /referal.
export default function ReferralCard() {
  return (
    <Link
      to="/referal"
      className="mt-4 bg-white rounded-[23px] border border-[#eef3f0] p-5 shadow-[0_8px_20px_rgba(34,83,62,0.08)] flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <span className="w-11 h-11 rounded-2xl bg-[#dbf8dc] grid place-items-center shrink-0">
        <Gift className="w-5 h-5 text-[#07884a]" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#10243a]">Ajak Teman, Dapat Kupon</p>
        <p className="text-xs text-[#667085]">
          Bagikan tautan referal, dapat potongan ongkir Rp4.000
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#667085] shrink-0" />
    </Link>
  );
}