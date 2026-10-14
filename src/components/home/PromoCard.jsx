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
          Gratis Fee Layanan
          3 Pesanan Pertama!
        </h2>
        <p className="text-[11px] text-[#10243a] m-0">Berlaku untuk semua jenis layanan.

        </p>
      </div>
      <div
        className="absolute right-6 top-5 text-[#159a3c] flex flex-col items-center gap-1 pointer-events-none"
        style={{ transform: "rotate(-9deg)" }}>
        <TicketPercent className="w-14 h-14" fill="white" stroke="#7fdf77" />
        <b className="text-[10px] leading-tight text-center text-[#10243a]">
          Lebih Hemat<br />Lebih Dekat
        </b>
      </div>
      <button
        aria-label="Lihat promo"
        onClick={() => toast({ title: "Promo gratis fee otomatis untuk 3 pesanan pertama" })}
        className="absolute right-4 bottom-3 w-[29px] h-[29px] rounded-full bg-[#07935b] text-white grid place-items-center active:scale-90 transition-transform">
        
        <ChevronRight className="w-4 h-4" />
      </button>
    </section>);

}