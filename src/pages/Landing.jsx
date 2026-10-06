import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bike,
  ShoppingBag,
  Package,
  MapPin,
  MessageCircle,
  Wallet,
  BadgeCheck,
  ShieldCheck,
  LogIn,
  UserPlus,
  Lock,
  Play,
} from "lucide-react";
import { Image } from "@/components/ui/image";

const LAYANAN = [
  {
    icon: Bike,
    title: "Antar Orang",
    desc: "Mau ke mana, disinilah saya. Layanan ojek penumpang untuk bepergian lebih cepat.",
    gradient: "linear-gradient(135deg, #007b64, #02864f)",
  },
  {
    icon: ShoppingBag,
    title: "Belanja Makanan",
    desc: "Bingung mau makan apa? Driver kami siap membeli dan mengantar makanan favoritmu.",
    gradient: "linear-gradient(135deg, #02864f, #4cae56)",
  },
  {
    icon: Package,
    title: "Antar Barang",
    desc: "Kirim paket atau dokumen dengan aman dan cepat ke alamat tujuanmu.",
    gradient: "linear-gradient(135deg, #4cae56, #8bd540)",
  },
];

const FITUR = [
  { icon: MapPin, title: "Tarif Transparan", desc: "Perhitungan tarif berdasarkan jarak. Untuk 4 km pertama tarif flat, tambahan tarif dikenakan untuk km berikutnya." },
  { icon: BadgeCheck, title: "Driver Terverifikasi", desc: "Setiap driver diverifikasi admin sebelum menerima pesanan." },
  { icon: MessageCircle, title: "Chat dengan Driver", desc: "Berkoordinasi langsung dengan driver saat pesanan berjalan." },
  { icon: Wallet, title: "Pembayaran Fleksibel", desc: "Bayar tunai atau QRIS, sesukamu." },
  { icon: ShieldCheck, title: "Data Terlindungi", desc: "Keamanan data dijaga dengan enkripsi dan pembatasan akses." },
];

export default function Landing() {
  const [googleExpanded, setGoogleExpanded] = useState(false);
  return (
    <div className="min-h-[100dvh] bg-[#eef8f2] [font-family:'Poppins',_sans-serif] text-[#10243a]">
      <div className="max-w-5xl mx-auto px-5 pb-10">
        {/* Header */}
        <header
          className="flex items-center justify-between pb-6 pt-10"
          style={{ paddingTop: "max(40px, calc(env(safe-area-inset-top) + 24px))" }}>
          <div className="flex items-center gap-2">
            <span className="tracking-tight font-bold text-2xl [font-family:'Poppins',_sans-serif]">
              Ojek<span className="text-[#07935b]">Ta</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-full text-sm font-semibold text-[#07935b] hover:bg-[#e5f5ec] transition-colors">
              Masuk
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#07935b] text-white hover:bg-[#06854f] transition-colors">
              Daftar
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-8 items-center pt-4 pb-12">
          <div>
            <span className="inline-block px-3 py-1.5 rounded-full bg-[#dbf8dc] text-[#07884a] text-xs font-semibold mb-4">
              Ojek & kurir Bulukumba
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight">
              Jalan lebih mudah,
              <br />
              aktivitas lebih dekat
              <br />
              bersama <span className="text-[#07935b]">OjekTa</span>.
            </h1>
            <p className="text-[#475467] mt-4 leading-relaxed">
              Solusi praktis untuk memesan ojek daring guna layanan antar orang,
              belanja makanan, serta pengiriman barang secara cepat, aman, dan
              efisien dalam satu aplikasi.
            </p>
            <div className="flex items-center gap-3 mt-7">
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#07935b] text-white font-semibold hover:bg-[#06854f] transition-colors">
                <LogIn className="w-4 h-4" /> Masuk
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-[#eef3f0] text-[#07935b] font-semibold hover:bg-[#f1faf5] transition-colors shadow-[0_8px_20px_rgba(34,83,62,0.08)]">
                <UserPlus className="w-4 h-4" /> Daftar
              </Link>
            </div>
            <a
              href="https://play.google.com/store/search?q=OjekTa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-5 py-3 rounded-full bg-[#10243a] text-white font-semibold hover:bg-[#1b3350] transition-colors">
              <Play className="w-4 h-4" /> Unduh di Play Store
            </a>
          </div>
          <div className="rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,83,56,0.16)] bg-white">
            <Image
              src="https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/e88782c9a_Screenshot_20261006_234045_Instagram.jpg"
              alt="OjekTa Bulukumba"
              className="w-full aspect-[4/3]"
              fittingType="fill" />
          </div>
        </section>

        {/* Layanan */}
        <section className="pb-12">
          <h2 className="text-2xl font-bold mb-1">Layanan Kami</h2>
          <p className="text-[#667085] text-sm mb-5">Satu aplikasi untuk semua kebutuhan perjalanan dan pengirimanmu.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {LAYANAN.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="bg-white rounded-[23px] border border-[#eef3f0] p-5 shadow-[0_8px_20px_rgba(34,83,62,0.08)]">
                  <span
                    className="w-14 h-14 rounded-2xl grid place-items-center text-white mb-3"
                    style={{ background: s.gradient }}>
                    <Icon className="w-7 h-7" />
                  </span>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-sm text-[#667085] leading-relaxed mt-1">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fitur Utama */}
        <section className="pb-12">
          <h2 className="text-2xl font-bold mb-1">Fitur Utama</h2>
          <p className="text-[#667085] text-sm mb-5">Semua yang kamu butuhkan untuk perjalanan dan pengiriman tanpa ribet.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FITUR.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-[23px] border border-[#eef3f0] p-5 shadow-[0_8px_20px_rgba(34,83,62,0.08)] flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#dbf8dc] text-[#07884a] grid place-items-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">{f.title}</h3>
                    <p className="text-xs text-[#667085] leading-relaxed mt-1">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Login Google */}
        <section className="pb-12">
          <div className="bg-white rounded-[23px] border border-[#eef3f0] p-6 md:p-8 shadow-[0_8px_20px_rgba(34,83,62,0.08)] flex items-start gap-4">
            <span className="w-12 h-12 rounded-2xl bg-[#dbf8dc] grid place-items-center shrink-0">
              <Lock className="w-6 h-6 text-[#07884a]" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Login dengan Google</h2>
              <p className="text-sm text-[#475467] leading-relaxed mt-2">
                OjekTa menggunakan login Google untuk membuat akun dan mengamankan data pengguna.
                {googleExpanded && (
                  <>
                    {" "}Saat masuk dengan Google, aplikasi hanya menerima
                    nama, alamat email, dan foto profil Anda. Tidak ada sandi Google
                    maupun data lain dari akun Google yang diakses, dan data tersebut
                    tidak pernah dijual atau dibagikan ke pihak ketiga.
                  </>
                )}
              </p>
              <button
                onClick={() => setGoogleExpanded(!googleExpanded)}
                className="mt-2 text-sm font-semibold text-[#07935b] hover:text-[#06854f]">
                {googleExpanded ? "Sembunyikan" : "Pelajari Lebih Lanjut"}
              </button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-14">
          <div className="rounded-[28px] p-8 text-white text-center bg-[linear-gradient(112deg,#007b64_0%,#02864f_43%,#8bd540_100%)]">
            <h2 className="text-2xl md:text-3xl font-extrabold">Siap berangkat dengan OjekTa?</h2>
            <p className="text-white/85 text-sm mt-2">Buat akunmu sekarang, gratis dan cepat.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link
                to="/login"
                className="px-6 py-3 rounded-full bg-white text-[#07935b] font-semibold hover:bg-[#f1faf5] transition-colors">
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-full bg-[#10243a]/20 border border-white/30 text-white font-semibold hover:bg-[#10243a]/30 transition-colors">
                Daftar
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#e3ede7] pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-semibold">
            Ojek<span className="text-[#07935b]">Ta</span>
          </span>
          <div className="flex items-center gap-5 text-xs text-[#667085]">
            <Link to="/privacy" className="underline underline-offset-2 hover:text-[#07935b]">
              Privacy Policy
            </Link>
            <Link to="/terms" className="underline underline-offset-2 hover:text-[#07935b]">
              Terms of Service
            </Link>
          </div>
          <span className="text-xs text-[#667085]">© {new Date().getFullYear()} OjekTa</span>
        </footer>
      </div>
    </div>
  );
}