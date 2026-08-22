import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import { base44 } from "@/api/base44Client";
import { Bike, Package, User, ArrowRight, Sparkles, ShieldCheck, Clock, MapPin } from "lucide-react";

const SERVICES = [
  {
    key: "food",
    title: "Beli Makanan",
    desc: "Pesan dari restoran favorit, driver belikan & antar",
    icon: Bike,
    color: "from-orange-400 to-rose-500",
  },
  {
    key: "goods",
    title: "Antar Barang",
    desc: "Kirim paket atau barang ke mana saja",
    icon: Package,
    color: "from-emerald-400 to-teal-500",
  },
  {
    key: "person",
    title: "Antar Orang",
    desc: "Naik ojek sampai tujuan dengan aman",
    icon: User,
    color: "from-sky-400 to-indigo-500",
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "user";

  return (
    <Layout>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-8 md:p-12 text-white shadow-xl shadow-primary/20">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-20 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Selamat datang, {user?.full_name?.split(" ")[0] || "Sobat"}!
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight max-w-lg">
            Ojek antar apa saja, sampai tujuan dengan cepat
          </h1>
          <p className="mt-3 text-white/80 max-w-md text-sm md:text-base">
            Makanan, barang, atau sekutan naik ojek — semua bisa. Driver terdekat siap membantu.
          </p>
          {role !== "driver" && (
            <button
              onClick={() => navigate("/pesan")}
              className="mt-6 inline-flex items-center gap-2 bg-white text-primary font-semibold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Pesan Sekarang <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-bold mb-4">Pilih Layanan</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => navigate(`/pesan?type=${s.key}`)}
                className="group text-left bg-card rounded-2xl p-5 border border-border hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                  Pesan <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {[
          { icon: MapPin, title: "Driver Terdekat", desc: "Otomatis cari ojek paling dekat dengan toko" },
          { icon: ShieldCheck, title: "Pembayaran Aman", desc: "Bayar di aplikasi, driver terima penghasilan" },
          { icon: Clock, title: "Cepat & Real-time", desc: "Pantau status pesanan setiap saat" },
        ].map((f) => {
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
            </div>
          );
        })}
      </div>

      {/* Driver CTA */}
      {role === "user" && (
        <div className="mt-8 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Mau jadi driver OjekKu?</h3>
            <p className="text-sm text-muted-foreground">Daftar dan mulai dapat penghasilan hari ini.</p>
          </div>
          <Link
            to="/jadi-driver"
            className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Daftar Jadi Driver
          </Link>
        </div>
      )}
    </Layout>
  );
}