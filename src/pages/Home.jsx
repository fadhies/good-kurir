import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import PullToRefresh from "@/components/PullToRefresh";
import S from "@/lib/supabaseEntities";
import { Bike, Package, Utensils, ArrowRight, Zap, Ticket, MapPin } from "lucide-react";

const SERVICES = [
{
  key: "food",
  title: "Beli Makanan",
  desc: "Kulineran",
  icon: Utensils,
  card: "bg-[#FFF7E6]",
  chip: "bg-[#FFEBC9] text-[#F59E0B]"
},
{
  key: "person",
  title: "Antar Orang",
  desc: "Ojek Cepat",
  icon: Bike,
  card: "bg-[#EEF2FF]",
  chip: "bg-[#E0E7FF] text-[#3B82F6]"
},
{
  key: "goods",
  title: "Antar Barang",
  desc: "Kirim Paket",
  icon: Package,
  card: "bg-[#E6FAF0]",
  chip: "bg-[#D1FAE5] text-[#10B981]"
}];


export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "user";
  const [driverProfile, setDriverProfile] = useState(null);

  async function loadDriver() {
    if (!user?.id) return;
    try {
      const list = await S.DriverProfile.filter({ user_id: user.id });
      setDriverProfile(list[0] || null);
    } catch {
      setDriverProfile(null);
    }
  }

  useEffect(() => {
    loadDriver();
  }, [user?.id]);

  return (
    <Layout>
      <PullToRefresh onRefresh={loadDriver}>
      {/* Greeting card */}
      <div className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl shadow-slate-900/10 bg-[#0B241A]">
        {/* Dekorasi rute: garis putus-putus melengkung + pin lokasi */}
        <svg className="absolute right-0 top-0 h-full w-32 pointer-events-none" viewBox="0 0 128 140" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M118 6 C 70 10, 40 40, 60 78 C 72 100, 100 112, 96 130" stroke="#4ADE80" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <div className="absolute right-3 bottom-11 text-[#4ADE80] pointer-events-none">
          <MapPin className="w-6 h-6" fill="#4ADE80" strokeWidth="0" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-xs text-[#E0E0E0] font-medium">Halo, {user?.full_name?.split(" ")[0] || "Sobat"}! 👋</p>
            <h1 className="text-xl font-bold mt-1 tracking-tight">Mau pesan apa hari ini?</h1>
            {role !== "driver" &&
              <button
                onClick={() => navigate("/pesan")}
                className="mt-3 bg-[#1DB97D] hover:bg-[#1DB97D]/90 text-white font-bold text-xs px-4 py-2 rounded-full transition-all inline-flex items-center gap-1.5">

                Pesan <ArrowRight className="w-3 h-3" />
              </button>
              }
          </div>
          <span className="bg-[#1A3D30] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
            Active
          </span>
        </div>
        {role !== "driver" &&
          <div className="relative z-10 mt-5 pt-4 border-t border-[#2C4A3E] flex items-center gap-2.5">
            <Bike className="w-4 h-4 text-white shrink-0" />
            <p className="text-xs font-medium text-[#E0E0E0]">
              Siap Antar — Driver terdekat menunggumu
            </p>
          </div>
          }
      </div>

      {/* Main services grid */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-foreground tracking-tight mb-3">Layanan Utama</h2>
        <div className="rounded-3xl shadow-[0_6px_20px_rgba(15,23,42,0.08)] p-4 bg-[#e1efe8]">
          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => navigate(`/pesan?type=${s.key}`)}
                    className="group text-left flex flex-col items-center text-center rounded-2xl p-2 hover:bg-white/50 transition-colors">

                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${s.chip} transition-transform group-hover:scale-110`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-[11px] font-bold text-slate-900 leading-tight mt-2">{s.title}</h3>
                    <p className="text-[9px] text-slate-900/60 leading-tight mt-0.5">{s.desc}</p>
                  </button>);

              })}
          </div>
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
      </PullToRefresh>
    </Layout>);

}