import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import PullToRefresh from "@/components/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2, ShoppingBag, ChevronRight } from "lucide-react";

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);

  async function reload() {
    try {
      const list = await base44.entities.Order.filter({}, "-created_date", 50);
      setOrders(list);
    } catch (e) {
      setOrders([]);
    }
  }

  useEffect(() => {
    reload();
    const unsub = base44.entities.Order.subscribe(() => reload());
    return unsub;
  }, []);

  return (
    <Layout>
      <PullToRefresh onRefresh={reload}>
      <h1 className="font-display text-2xl font-extrabold mb-1">Pesanan Saya</h1>
      <p className="text-muted-foreground text-sm mb-6">Riwayat dan status pesanan Anda.</p>

      {orders === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold mb-1">Belum ada pesanan</p>
          <p className="text-sm text-muted-foreground mb-4">Yuk pesan ojek pertama Anda!</p>
          <button
            onClick={() => navigate("/pesan")}
            className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl"
          >
            Pesan Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => navigate(`/pesanan/${o.id}`)}
              className="w-full text-left bg-card rounded-2xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">{o.store_name || "Pesanan"}</p>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="text-sm text-muted-foreground truncate">{o.destination_address}</p>
                <p className="text-sm font-semibold text-primary mt-1">{formatRupiah((o.item_cost || 0) + (o.delivery_fee || 0))}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
      </PullToRefresh>
    </Layout>
  );
}