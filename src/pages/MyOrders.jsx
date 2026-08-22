import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import PullToRefresh from "@/components/PullToRefresh";
import { useIsDriver } from "@/hooks/useIsDriver";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { enrichOrdersStoreName } from "@/lib/orderEnrich";
import { Loader2, ShoppingBag, Bike, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDriver = useIsDriver();
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState("pemesan");

  async function reload() {
    try {
      const list = await base44.entities.Order.filter({}, "-created_date", 50);
      setOrders(list);
      enrichOrdersStoreName(list, (id, name) =>
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, store_name: name } : o)))
      );
    } catch (e) {
      setOrders([]);
    }
  }

  useEffect(() => {
    reload();
    const unsub = base44.entities.Order.subscribe(() => reload());
    return unsub;
  }, []);

  const asPemesan = (orders || []).filter((o) => o.created_by_id === user?.id);
  const asDriver = (orders || []).filter((o) => o.driver_id === user?.id);
  const activeTab = isDriver ? tab : "pemesan";
  const list = activeTab === "pemesan" ? asPemesan : asDriver;

  return (
    <Layout>
      <PullToRefresh onRefresh={reload}>
      <h1 className="font-display text-2xl font-extrabold mb-1">Pesanan Saya</h1>
      <p className="text-muted-foreground text-sm mb-4">Riwayat dan status pesanan Anda.</p>

      {/* Tab pemesan / driver — hanya untuk driver */}
      {isDriver && (
      <div className="grid grid-cols-2 gap-2 mb-6 bg-secondary p-1 rounded-2xl">
        <button
          onClick={() => setTab("pemesan")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            tab === "pemesan" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
          )}
        >
          <ShoppingBag className="w-4 h-4" /> Sebagai Pemesan
        </button>
        <button
          onClick={() => setTab("driver")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            tab === "driver" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
          )}
        >
          <Bike className="w-4 h-4" /> Sebagai Driver
        </button>
      </div>
      )}

      {orders === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            {activeTab === "pemesan" ? <ShoppingBag className="w-8 h-8 text-muted-foreground" /> : <Bike className="w-8 h-8 text-muted-foreground" />}
          </div>
          <p className="font-semibold mb-1">
            {activeTab === "pemesan" ? "Belum ada pesanan" : "Belum ada orderan sebagai driver"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {activeTab === "pemesan" ? "Yuk pesan ojek pertama Anda!" : "Terima pesanan tersedia dari dashboard driver."}
          </p>
          {activeTab === "pemesan" && (
            <button
              onClick={() => navigate("/pesan")}
              className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl"
            >
              Pesan Sekarang
            </button>
          )}
          {activeTab === "driver" && (
            <button
              onClick={() => navigate("/driver")}
              className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl"
            >
              Buka Dashboard Driver
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <button
              key={o.id}
              onClick={() => navigate(`/pesanan/${o.id}`)}
              className="w-full text-left bg-card rounded-2xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {activeTab === "pemesan" ? <ShoppingBag className="w-5 h-5 text-primary" /> : <Bike className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">{o.type === "food" ? "Beli Makanan" : o.type === "goods" ? "Antar Barang" : "Antar Orang"}</p>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate">Dari: {o.store_name}</p>
                <p className="text-sm text-muted-foreground truncate">→ {o.destination_address}</p>
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