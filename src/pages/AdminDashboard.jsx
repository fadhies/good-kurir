import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import { Users, Bike, Clock, ListOrdered, Loader2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, drivers, orders, txs] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.DriverProfile.list(),
          base44.entities.Order.list("-created_date", 100),
          base44.entities.WalletTransaction.list("-created_date", 100),
        ]);
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
          feeRevenue: revenue,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const cards = [
    { label: "Total Pengguna", value: stats.users, icon: Users, color: "from-sky-500 to-indigo-500" },
    { label: "Driver Disetujui", value: stats.approved, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
    { label: "Menunggu Verifikasi", value: stats.pending, icon: AlertCircle, color: "from-amber-500 to-orange-500", to: "/admin/driver" },
    { label: "Pesanan Aktif", value: stats.activeOrders, icon: Clock, color: "from-cyan-500 to-blue-500" },
    { label: "Total Pesanan", value: stats.totalOrders, icon: ListOrdered, color: "from-violet-500 to-purple-500" },
    { label: "Pendapatan Biaya Layanan", value: `Rp ${stats.feeRevenue.toLocaleString("id-ID")}`, icon: TrendingUp, color: "from-rose-500 to-pink-500" },
  ];

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1">Ringkasan</h1>
      <p className="text-muted-foreground text-sm mb-6">Pantau aktivitas platform KurirTa.</p>

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
            <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
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
    </AdminLayout>
  );
}