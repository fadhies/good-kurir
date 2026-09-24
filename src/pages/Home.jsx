import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import S from "@/lib/supabaseEntities";
import { Bike, Package, Utensils, ArrowRight, Zap, Ticket } from "lucide-react";

const SERVICES = [
{
  key: "food",
  title: "Beli Makanan",
  desc: "Kulineran",
  icon: Utensils,
  chip: "bg-amber-50 text-amber-600"
},
{
  key: "person",
  title: "Antar Orang",
  desc: "Ojek Cepat",
  icon: Bike,
  chip: "bg-blue-50 text-blue-600"
},
{
  key: "goods",
  title: "Antar Barang",
  desc: "Kirim Paket",
  icon: Package,
  chip: "bg-emerald-50 text-emerald-600"
}];


export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "user";
  const [driverProfile, setDriverProfile] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    S.DriverProfile.filter({ user_id: user.id }).
    then((list) => active && setDriverProfile(list[0] || null)).
    catch(() => active && setDriverProfile(null));
    return () => {active = false;};
  }, [user?.id]);

  return (
    <Layout>
      {/* Greeting card */}
      <div className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl shadow-slate-900/10 bg-slate-900">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium">Halo, {user?.full_name?.split(" ")[0] || "Sobat"}! 👋</p>
            <h1 className="text-xl font-bold mt-1 tracking-tight">Mau ke mana hari ini?</h1>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Active
          </span>
        </div>
        {role !== "driver" &&
        <div className="relative z-10 mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Siap Antar</p>
              <p className="text-sm font-bold text-white truncate">Driver terdekat menunggumu</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/pesan")}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap">

              Pesan <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        }
      </div>

      {/* Main services grid */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-foreground tracking-tight mb-3">Layanan Utama</h2>
        <div className="grid grid-cols-3 gap-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => navigate(`/pesan?type=${s.key}`)}
                className="group bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left flex flex-col justify-between">

                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${s.chip} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-foreground">{s.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </button>);

          })}
        </div>
      </div>

      {/* Promo banner */}
      <div className="mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-600/15 relative overflow-hidden">
        <div className="max-w-[70%]">
          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
            Promo Spesial
          </span>
          <h3 className="text-base font-extrabold mt-2 leading-snug">Diskon 50% Naik Ojek Pertama!</h3>
          <p className="text-xs text-emerald-100 mt-1 opacity-90">Gunakan kode <span className="font-bold underline">OJEKTANEW</span></p>
        </div>
        <Ticket className="w-24 h-24 text-white/10 absolute -right-2 -bottom-3 rotate-12" />
      </div>

      {/* Driver status info */}
      <div className="mt-6 bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-foreground">Driver Terdekat Siap!</h4>
          <p className="text-[11px] text-muted-foreground">Estimasi penjemputan &lt; 3 menit di sekitarmu.</p>
        </div>
      </div>

      {/* Driver CTA */}
      {role === "user" &&
      <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Mau jadi driver OjekTa?</h3>
            <p className="text-sm text-muted-foreground">
              {driverProfile?.verification_status === "pending" ?
            "Pendaftaran Anda sedang diverifikasi admin." :
            driverProfile?.verification_status === "approved" ?
            "Anda sudah terdaftar sebagai driver." :
            driverProfile?.verification_status === "rejected" ?
            "Pendaftaran Anda ditolak. Hubungi admin untuk informasi." :
            "Daftar dan mulai dapat penghasilan hari ini."}
            </p>
          </div>
          {driverProfile ?
        <button
          disabled
          className="bg-muted text-muted-foreground font-semibold px-5 py-2.5 rounded-xl cursor-not-allowed whitespace-nowrap">

              {driverProfile.verification_status === "pending" ?
          "Menunggu Verifikasi" :
          driverProfile.verification_status === "approved" ?
          "Sudah Terdaftar" :
          "Pendaftaran Ditolak"}
            </button> :

        <Link
          to="/jadi-driver"
          className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">

              Daftar Jadi Driver
        </Link>
        }
        </div>
      }

      {/* Footer */}
      <div className="mt-10 pb-2 text-center">
        <Link to="/privacy" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary">
          Kebijakan Privasi
        </Link>
      </div>
    </Layout>);

}