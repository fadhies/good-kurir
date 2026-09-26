import React from "react";
import { ChevronRight, TicketPercent } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PromoCard() {
  const { toast } = useToast();
  return (
    <section className="relative rounded-[23px] p-4 min-h-[132px] flex items-center overflow-hidden mb-3.5 bg-[linear-gradient(105deg,#ebffe8,#dfffd5)]">
      <div className="max-w-[65%]">
        <span className="uppercase bg-[#0b9c54] text-white rounded-[12px] px-2.5 py-1 text-[9px] font-bold tracking-wide">
          Promo Spesial
        </span>
        <h2 className="leading-[1.15] font-bold text-[#10243a] mt-2 mb-1 text-base">
          Diskon 50% 
          Naik Ojek Pertama!
        </h2>
        <p className="text-[11px] text-[#10243a] m-0">
          Gunakan kode{" "}
          <b className="border border-[#78d56b] rounded-[13px] px-2 py-0.5 text-[#087b42]">OJEKTANEW</b>
        </p>
      </div>
      <div
        className="absolute right-6 top-7 text-[#159a3c] flex items-center gap-1 pointer-events-none"
        style={{ transform: "rotate(-9deg)" }}>
        
        <TicketPercent className="w-[58px] h-[58px] text-[#38b83f]" />
        <b className="text-[10px] leading-tight">
          Lebih Hemat<br />Lebih Dekat
        </b>
      </div>
      <button
        aria-label="Lihat promo"
        onClick={() => toast({ title: "Kode promo: OJEKTANEW" })}
        className="absolute right-4 bottom-3 w-[29px] h-[29px] rounded-full bg-[#07935b] text-white grid place-items-center active:scale-90 transition-transform">
        
        <ChevronRight className="w-4 h-4" />
      </button>
    </section>);

}