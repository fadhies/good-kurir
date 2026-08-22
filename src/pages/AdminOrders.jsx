import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2, ListOrdered, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { key: "all", label: "Semua" },
  { key: "pending_match", label: "Mencari Driver" },
  { key: "driver_assigned", label: "Driver Ditemukan" },
  { key: "on_the_way", label: "Dalam Perjalanan" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [o, u] = await Promise.all([
          base44.entities.Order.list("-created_date", 200),
          base44.entities.User.list(),
        ]);
        setOrders(o);
        setUsers(u);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u; });
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => (status === "all" ? true : o.status === status))
      .filter((o) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          (o.store_name || "").toLowerCase().includes(q) ||
          (o.destination_address || "").toLowerCase().includes(q) ||
          (o.id || "").toLowerCase().includes(q)
        );
      });
  }, [orders, status, search]);

  const typeLabel = (t) => (t === "food" ? "Makanan" : t === "goods" ? "Barang" : "Orang");
  const methodLabel = (m) => (m || "cash").toUpperCase();

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1">Pesanan</h1>
      <p className="text-muted-foreground text-sm mb-6">Pantau semua pesanan di platform.</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-card border border-border rounded-xl p-1 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                status === s.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari toko, tujuan, ID..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <ListOrdered className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Tidak ada pesanan ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const buyer = userMap[o.created_by_id];
            const driver = userMap[o.driver_id];
            return (
              <div key={o.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{o.store_name || "Pesanan"}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{typeLabel(o.type)}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{o.mode || "hemat"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">→ {o.destination_address}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-muted-foreground">Pemesan</p>
                    <p className="font-medium truncate">{buyer?.full_name || buyer?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Driver</p>
                    <p className="font-medium truncate">{driver?.full_name || driver?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pembayaran</p>
                    <p className="font-medium">{methodLabel(o.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold text-primary">{formatRupiah(o.total_amount || o.delivery_fee || 0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}