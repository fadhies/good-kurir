import React from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Soup, Package } from "lucide-react";

const SERVICES = [
  {
    key: "person",
    name: "OjekTa",
    desc: "Pergi ke mana saja",
    icon: Bike,
    gradient: "linear-gradient(135deg,#64cc39,#006443)"
  },
  {
    key: "food",
    name: "MakanTa",
    desc: "Pesan makanan favoritmu",
    icon: Soup,
    gradient: "linear-gradient(135deg,#ffc637,#f76f2d)"
  },
  {
    key: "goods",
    name: "KurirTa",
    desc: "Kirim barang dan belanjaan",
    icon: Package,
    gradient: "linear-gradient(135deg,#10c0b3,#00726c)"
  }
];

export default function ServiceGrid() {
  const navigate = useNavigate();
  return (
    <section aria-label="Layanan utama" className="grid grid-cols-3 gap-1 px-2 pt-6 pb-4">
      {SERVICES.map((s, i) => {
        const Icon = s.icon;
        return (
          <button
            key={s.key}
            onClick={() => navigate(`/pesan?type=${s.key}`)}
            className={`flex flex-col items-center text-center text-[#10243a] px-1 py-2 ${i < SERVICES.length - 1 ? "border-r border-[#d8e3de]" : ""}`}
          >
            <span
              className="w-[72px] h-[72px] rounded-full grid place-items-center text-white shadow-[0_10px_16px_rgba(10,106,79,0.16)]"
              style={{ background: s.gradient }}
            >
              <Icon className="w-[38px] h-[38px]" />
            </span>
            <b className="text-base font-bold mt-2">{s.name}</b>
            <small className="text-[9px] leading-[1.25] text-[#26384b]">{s.desc}</small>
          </button>
        );
      })}
    </section>
  );
}