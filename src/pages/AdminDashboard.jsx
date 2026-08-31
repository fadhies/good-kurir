import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { Users, Bike, Clock, ListOrdered, Loader2, TrendingUp, AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { formatRupiah } from "@/lib/geo";
import PhotoUpload from "@/components/PhotoUpload";
import { QrCode } from "lucide-react";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, txs: [] });
  const [loading, setLoading] = useState(true);
  const [qrisPhoto, setQrisPhoto] = useState(null);
  const [savingQris, setSavingQris] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Panggilan berurutan + jeda kecil agar tidak kena burst rate-limit platform
      const users = await base44.entities.User.list();
      await sleep(250);
      const drivers = await base44.entities.DriverProfile.list();
      await sleep(250);
      const orders = await S.Order.list("-created_date", 100);
      await sleep(250);
      const txs = await base44.entities.WalletTransaction.list("-created_date", 100);

      const pending = drivers.filter((d) => d.verification_status === "pending");
      const active = orders.filter((o) =>
      ["driver_assigned", "at_store", "awaiting_payment", "paid", "on_the_way"].includes(o.status)
      );
      const completed = orders.filter((o) => o.status === "completed");
      const revenue = txs.filter((t) => t.type === "debit").reduce((s, t) => s + (t.amount || 0), 0);
      setStats({
        users: users.length,
        drivers: drivers.length,
        pending: pending.length,
        approved: drivers.filter((d) => d.verification_status === "approved").length,
        activeOrders: active.length,
        completedOrders: completed.length,
        totalOrders: orders.length,
        feeRevenue: revenue
      });

      // Saldo & transaksi admin dihitung dari daftar txs (menghindari panggilan tambahan)
      const adminTxs = txs.filter((t) => t.user_id === user.id).slice(0, 20);
      const adminBalance = adminTxs.reduce((s, t) => s + (t.type === "credit" ? t.amount : -t.amount), 0);
      setWallet({ balance: adminBalance, txs: adminTxs });

      await sleep(250);
      const qrisRows = await base44.entities.AppSetting.filter({ key: "owner_qris" }, "-created_date", 1);
      setQrisPhoto(qrisRows[0]?.value || null);
    } catch (e) {
      setError(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveQris() {
    if (!qrisPhoto) return;
    setSavingQris(true);
    try {
      const rows = await base44.entities.AppSetting.filter({ key: "owner_qris" }, "-created_date", 1);
      if (rows[0]) {
        await base44.entities.AppSetting.update(rows[0].id, { value: qrisPhoto });
      } else {
        await base44.entities.AppSetting.create({ key: "owner_qris", value: qrisPhoto });
      }
      alert("QRIS pemilik tersimpan.");
    } catch (e) {
      alert("Gagal menyimpan: " + e.message);
    } finally {
      setSavingQris(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>);

  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
          <p className="font-semibold mb-1">Gagal memuat data</p>
          <p className="text-sm text-muted-foreground mb-4">{error || "Terjadi kesalahan. Coba lagi sebentar."}</p>
          <button onClick={load} className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl">
            Coba Lagi
          </button>
        </div>
      </AdminLayout>);

  }

  const cards = [
  { label: "Total Pengguna", value: stats.users, icon: Users, color: "from-sky-500 to-indigo-500" },
  { label: "Driver Disetujui", value: stats.approved, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
  { label: "Menunggu Verifikasi", value: stats.pending, icon: AlertCircle, color: "from-amber-500 to-orange-500", to: "/admin/driver" },
  { label: "Pesanan Aktif", value: stats.activeOrders, icon: Clock, color: "from-cyan-500 to-blue-500" },
  { label: "Total Pesanan", value: stats.totalOrders, icon: ListOrdered, color: "from-violet-500 to-purple-500" },
  { label: "Pendapatan Biaya Layanan", value: `Rp ${stats.feeRevenue.toLocaleString("id-ID")}`, icon: TrendingUp, color: "from-rose-500 to-pink-500" }];


  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1">Ringkasan</h1>
      <p className="text-muted-foreground text-sm mb-6">Pantau aktivitas platform Good Kurir.</p>

      {stats.pending > 0 &&
      <Link
        to="/admin/driver"
        className="block mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors">
        
          {stats.pending} pendaftar driver menunggu verifikasi Anda →
        </Link>
      }

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner =
          <div className="bg-card border border-border p-5 hover:shadow-md transition-shadow rounded-2xl">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>;

          return c.to ? <Link key={c.label} to={c.to}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-extrabold mb-1 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" /> QRIS Pemilik
        </h2>
        <p className="text-muted-foreground text-sm mb-4">QRIS rekening Anda yang ditampilkan ke user saat bayar tagihan toko (food). Dana masuk ke rekening Anda, lalu direimburse ke dompet driver saat pesanan selesai.</p>
        <div className="bg-card rounded-2xl border border-border p-5 mb-8 max-w-sm">
          <PhotoUpload
            label="Gambar QRIS"
            value={qrisPhoto}
            onChange={setQrisPhoto}
            hint="Unggah screenshot/foto QRIS dari e-wallet/bank Anda." />
          
          <button
            onClick={saveQris}
            disabled={savingQris || !qrisPhoto}
            className="w-full mt-3 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60">
            
            {savingQris ? "Menyimpan..." : "Simpan QRIS"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        
        
        




        
        
        <div className="space-y-2">
          {wallet.txs.length === 0 ?
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p> :

          wallet.txs.map((t) =>
          <div key={t.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <p className={`font-bold text-sm shrink-0 ${t.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>{t.type === "credit" ? "+" : "-"}{formatRupiah(t.amount)}</p>
              </div>
          )
          }
        </div>
      </div>
    </AdminLayout>);

}