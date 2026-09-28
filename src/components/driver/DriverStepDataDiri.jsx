import React from "react";

const inputCls =
  "w-full mt-1.5 px-4 py-3.5 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 bg-white transition-colors placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-800";

export default function DriverStepDataDiri({ data, onChange, email }) {
  const danaValue = data.danaSame ? data.phone : data.danaNumber;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Data Diri</h2>
        <p className="text-xs text-slate-500 mt-0.5">Lengkapi identitas Anda</p>
      </div>

      <label className={labelCls}>
        Nama Lengkap
        <input
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Masukkan nama lengkap"
          className={inputCls}
        />
      </label>

      <label className={labelCls}>
        Tanggal Lahir
        <input
          type="date"
          value={data.birthDate}
          onChange={(e) => onChange({ birthDate: e.target.value })}
          className={inputCls}
        />
      </label>

      <label className={labelCls}>
        Nomor HP
        <input
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          inputMode="numeric"
          placeholder="08xxxxxxxxxx"
          className={inputCls}
        />
      </label>

      <div>
        <label className={labelCls}>
          Nomor DANA
          <input
            value={danaValue}
            onChange={(e) => onChange({ danaNumber: e.target.value })}
            disabled={data.danaSame}
            inputMode="numeric"
            placeholder="08xxxxxxxxxx"
            className={`${inputCls} ${data.danaSame ? "bg-slate-50 text-slate-500" : ""}`}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 -mt-1">
          <input
            type="checkbox"
            checked={data.danaSame}
            onChange={(e) => onChange({ danaSame: e.target.checked })}
            className="w-4 h-4 accent-emerald-600"
          />
          Sama dengan nomor HP
        </label>
      </div>

      <label className={labelCls}>
        Email
        <input value={email} disabled className={`${inputCls} bg-slate-50 text-slate-500`} />
        <span className="block mt-1 text-[10px] text-slate-400">
          Email terhubung ke akun Anda dan tidak dapat diubah
        </span>
      </label>
    </div>
  );
}