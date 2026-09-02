import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import S from "@/lib/supabaseEntities";
import { Bike, Package, User, ArrowRight, Sparkles, ShieldCheck, Clock, MapPin } from "lucide-react";

const SERVICES = [
{
  key: "food",
  title: "Beli Makanan",
  desc: "Pesan dari restoran favorit, driver belikan & antar",
  icon: Bike,
  color: "from-orange-400 to-rose-500"
},
{
  key: "goods",
  title: "Antar Barang",
  desc: "Kirim paket atau barang ke mana saja",
  icon: Package,
  color: "from-emerald-400 to-teal-500"
},
{
  key: "person",
  title: "Antar Orang",
  desc: "Naik ojek sampai tujuan dengan aman",
  icon: User,
  color: "from-sky-400 to-indigo-500"
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
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[#D3D919] p-5 md:p-8 text-white shadow-xl shadow-green/30">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 text-[hsl(var(--secondary-foreground))] bg-[hsl(var(--card-foreground))]">
              <Sparkles className="w-3 h-3" /> Halo, {user?.full_name?.split(" ")[0] || "Sobat"}!
            </div>
            <h1 className="text-2xl md:text-3xl leading-tight text-[hsl(var(--popover-foreground))] [font-family:'Cabin',_sans-serif] font-medium">
              Pesan Antar Apa Saja
            </h1>
            <p className="mt-1 text-xs md:text-sm text-[hsl(var(--popover-foreground))]">
              Makanan, barang, atau naik ojek — driver terdekat siap bantu.
            </p>
          </div>
          {role !== "driver" &&
          <button
            onClick={() => navigate("/pesan")}
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all self-start sm:self-auto whitespace-nowrap text-sm">
            
              Pesan Sekarang <ArrowRight className="w-4 h-4" />
            </button>
          }
        </div>
      </div>

      {/* Services */}
      <div className="mt-5">
        <h2 className="text-lg mb-3 [font-family:'Aether',_sans-serif] font-normal">Pilih Layanan</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => navigate(`/pesan?type=${s.key}`)}
                className="group text-left bg-card rounded-xl p-3 border border-border hover:border-primary/40 hover:shadow-lg transition-all flex items-center gap-3 sm:flex-col sm:items-start">
                
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md sm:mb-2 shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base leading-tight">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">{s.desc}</p>
                  <div className="mt-1 sm:mt-2 inline-flex items-center gap-1 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
                    Pesan <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>);

          })}
        </div>
      </div>

      {/* Features */}
      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {[
        { icon: MapPin, title: "Driver Terdekat", desc: "Otomatis cari ojek paling dekat dengan toko" },
        { icon: ShieldCheck, title: "Pembayaran Aman", desc: "Bayar di aplikasi, driver terima penghasilan" },
        { icon: Clock, title: "Cepat & Real-time", desc: "Pantau status pesanan setiap saat" }].
        map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>);

        })}
      </div>

      {/* Driver CTA */}
      {role === "user" &&
      <div className="mt-8 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Mau jadi driver Good Kurir?</h3>
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