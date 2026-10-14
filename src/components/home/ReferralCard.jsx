import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Gift } from "lucide-react";

// Kartu ajakan program referal di Beranda -> halaman /referal.
// Mengikuti gaya kartu promo gratis fee layanan.
export default function ReferralCard() {
  return (
    <Link
      to="/referal"
      className="relative rounded-[23px] p-4 min-h-[132px] flex items-center overflow-hidden mb-3.5 bg-[linear-gradient(105deg,#ebffe8,#dfffd5)] active:scale-[0.98] transition-transform"
    >
      <div className="max-w-[65%]">
        <span className="uppercase bg-[#0b9c54] text-white rounded-[12px] px-2.5 py-1 text-[9px] font-bold tracking-wide">
          Program Referal
        </span>
        <h2 className="leading-[1.15] font-bold text-[#10243a] mt-2 mb-1 text-base">
          Ajak Teman, Dapat
          Potongan Ongkir Rp2.000!
        </h2>
        <p className="text-[11px] text-[#10243a] m-0">
          Berlaku saat temanmu menyelesaikan order pertamanya.
        </p>
      </div>
      <div
        className="absolute right-6 top-5 text-[#159a3c] flex flex-col items-center gap-1 pointer-events-none"
        style={{ transform: "rotate(-9deg)" }}>
        <Gift className="w-14 h-14 text-[#159a3c]" />
        <b className="text-[10px] leading-tight text-center text-[#10243a]">
          Bagikan<br />Dapat Kupon
        </b>
      </div>
      <span className="absolute right-4 bottom-3 w-[29px] h-[29px] rounded-full bg-[#07935b] text-white grid place-items-center">
        <ChevronRight className="w-4 h-4" />
      </span>
    </Link>
  );
}