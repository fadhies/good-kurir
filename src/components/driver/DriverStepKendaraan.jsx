import React from "react";
import { Bike, Car } from "lucide-react";

const inputCls =
  "w-full mt-1.5 px-4 py-3.5 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 bg-white transition-colors placeholder:text-slate-400";

const VEHICLES = [
  { v: "motorcycle", label: "Motor", Icon: Bike },
  { v: "car", label: "Mobil", Icon: Car },
];

export default function DriverStepKendaraan({ data, onChange }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Data Kendaraan</h2>
        <p className="text-xs text-slate-500 mt-0.5">Pilih jenis kendaraan Anda</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {VEHICLES.map(({ v, label, Icon }) => {
          const sel = data.vehicle === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ vehicle: v })}
              className={`min-h-[120px] rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                sel
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <Icon className="w-10 h-10" />
              <span className="font-bold text-sm">{label}</span>
            </button>
          );
        })}
      </div>
      <label className="block text-xs font-bold text-slate-800 mt-5">
        Plat Nomor
        <input
          value={data.plate}
          onChange={(e) => onChange({ plate: e.target.value.toUpperCase() })}
          placeholder="Contoh: DD 1234 AB"
          className={inputCls}
        />
      </label>
    </div>
  );
}