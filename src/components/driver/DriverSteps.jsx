import React from "react";

const STEPS = ["Data Diri", "Kendaraan", "Dokumen", "Selesai"];

export default function DriverSteps({ step }) {
  return (
    <div className="grid grid-cols-4 mb-6">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const on = n <= step;
        return (
          <div key={label} className="text-center">
            <div
              className={`w-7 h-7 mx-auto rounded-full grid place-items-center text-xs font-bold ${
                on ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
              }`}
            >
              {n < step ? "✓" : n}
            </div>
            <span
              className={`block mt-1 text-[9px] font-semibold ${
                on ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}