import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import S from "@/lib/supabaseEntities";
import { Clock, Loader2, TrendingUp, AlertCircle, XCircle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { formatRupiah } from "@/lib/geo";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, txs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Ambil data secara paralel agar loading lebih cepat
      const [drivers, orders, adminTxs] = await Promise.all([
        S.DriverProfile.list(),
        S.Order.list("-created_date", 100),
        S.WalletTransaction.filter({ user_id: user.id }, "-created_date", 20),
      ]);

      const pending = drivers.filter((d) => d.verification_status === "pending");
      const rejected = drivers.filter((d) => d.verification_status === "rejected");
      const active = orders.filter((o) =>
        ["driver_assigned", "at_store", "awaiting_payment", "paid", "on_the_way"].includes(o.status)
      );
      const completed = orders.filter((o) => o.status === "completed");
      // Pendapatan = akumulasi fee admin (driver_remit_fee) + fee layanan dari order selesai
      const feeRevenue = completed.reduce(
        (s, o) => s + (o.driver_remit_fee || 0) + (o.service_fee || 0),
        0
      );

      setStats({
        pending: pending.length,
        rejected: rejected.length,
        activeOrders: active.length,
        feeRevenue,
      });

      const adminBalance = adminTxs.reduce(
        (s, t) => s + (t.type === "credit" ? t.amount : -t.amount),
        0
      );
      setWallet({ balance: adminBalance, txs: adminTxs });
    } catch (e) {
      setError(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
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
      </AdminLayout>
    );
  }

  const cards = [
    { label: "Driver Ditolak", value: stats.rejected, icon: XCircle, color: "from-red-500 to-rose-500", to: "/admin/driver" },
    { label: "Menunggu Verifikasi", value: stats.pending, icon: AlertCircle, color: "from-amber-500 to-orange-500", to: "/admin/driver" },
    { label: "Pesanan Aktif", value: stats.activeOrders, icon: Clock, color: "from-cyan-500 to-blue-500", to: "/admin/orders" },
    { label: "Pendapatan Biaya Layanan", value: formatRupiah(stats.feeRevenue), icon: TrendingUp, color: "from-rose-500 to-pink-500", to: "/admin/orders" },
  ];

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1">Ringkasan</h1>
      <p className="text-muted-foreground text-sm mb-6">Pantau aktivitas platform Good Kurir.</p>

      {stats.pending > 0 && (
        <Link
          to="/admin/driver"
          className="block mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
        >
          {stats.pending} pendaftar driver menunggu verifikasi Anda →
        </Link>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (
            <div className="bg-card border border-border p-5 hover:shadow-md transition-shadow rounded-2xl cursor-pointer h-full">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          );
          return c.to ? <Link key={c.label} to={c.to}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-extrabold mb-1 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" /> Dompet Admin
        </h2>
        <p className="text-muted-foreground text-sm mb-4">Saldo: {formatRupiah(wallet.balance)}</p>
        <div className="space-y-2">
          {wallet.txs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p>
          ) : (
            wallet.txs.map((t) => (
              <div key={t.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <p className={`font-bold text-sm shrink-0 ${t.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>{t.type === "credit" ? "+" : "-"}{formatRupiah(t.amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}