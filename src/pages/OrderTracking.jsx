import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { ArrowLeft, Loader2, Store, MapPin, FileText, Bike, CreditCard, CheckCircle2, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TIMELINE = [
  { key: "pending_match", label: "Mencari Driver" },
  { key: "driver_assigned", label: "Driver Menuju Toko" },
  { key: "at_store", label: "Di Toko, memesan" },
  { key: "awaiting_payment", label: "Menunggu Pembayaran" },
  { key: "paid", label: "Pembayaran Selesai" },
  { key: "on_the_way", label: "Dalam Perjalanan" },
  { key: "completed", label: "Selesai" },
];

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemCost, setItemCost] = useState("");
  const [billNote, setBillNote] = useState("");
  const [acting, setActing] = useState(false);

  async function loadOrder() {
    try {
      const o = await base44.entities.Order.get(id);
      setOrder(o);
      setItemCost(o.item_cost ? String(o.item_cost) : "");
    } catch (e) {
      toast({ title: "Pesanan tidak ditemukan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.id === id) loadOrder();
    });
    return unsub;
  }, [id]);

  const role = user?.role || "user";
  const isDriver = role === "driver" && order?.driver_id === user?.id;
  const isOwner = order?.created_by_id === user?.id;

  async function updateStatus(status, extra = {}) {
    setActing(true);
    try {
      await base44.entities.Order.update(id, { status, ...extra });
      toast({ title: "Status diperbarui" });
      loadOrder();
    } catch (e) {
      toast({ title: "Gagal memperbarui", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  async function submitBill() {
    const cost = Number(itemCost);
    if (!cost || cost <= 0) {
      toast({ title: "Masukkan nominal bill yang valid", variant: "destructive" });
      return;
    }
    setActing(true);
    try {
      await base44.entities.Order.update(id, {
        status: "awaiting_payment",
        item_cost: cost,
        store_bill_note: billNote,
      });
      toast({ title: "Bill dikirim, menunggu pembayaran user" });
      loadOrder();
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  async function pay() {
    setActing(true);
    try {
      const res = await base44.functions.invoke("completeOrderPayment", { orderId: id });
      if (res.data?.success) {
        toast({ title: "Pembayaran berhasil!", description: `Total ${formatRupiah(res.data.total_amount)}` });
        loadOrder();
      } else {
        toast({ title: "Gagal bayar", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal bayar", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  async function settleCash() {
    setActing(true);
    try {
      const res = await base44.functions.invoke("completeOrderPayment", { orderId: id });
      if (res.data?.success) {
        toast({ title: "Pesanan selesai", description: "Biaya Rp2.000 dipotong dari dompet" });
        loadOrder();
      } else {
        toast({ title: "Gagal menyelesaikan", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <p className="text-center py-20 text-muted-foreground">Pesanan tidak ditemukan.</p>
      </Layout>
    );
  }

  const isCash = order.payment_method === "cash";
  const labeledTimeline = TIMELINE.map((t) =>
    t.key === "at_store"
      ? { ...t, label: order.type === "person" ? "Di Lokasi Jemput" : order.type === "goods" ? "Di Lokasi Ambil" : "Di Toko, Memesan" }
      : t
  );
  const timeline = isCash
    ? labeledTimeline.filter((t) => t.key !== "awaiting_payment" && t.key !== "paid")
    : labeledTimeline;
  const currentIdx = timeline.findIndex((t) => t.key === order.status);
  const total = (order.item_cost || 0) + (order.delivery_fee || 0);

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Pesanan #{String(order.id).slice(-6)}</h1>
          <p className="text-sm text-muted-foreground capitalize">{order.type === "food" ? "Beli Makanan" : order.type === "goods" ? "Antar Barang" : "Antar Orang"}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between">
          {timeline.map((t, i) => (
            <div key={t.key} className="flex flex-col items-center flex-1 relative">
              {i < TIMELINE.length - 1 && (
                <div
                  className={`absolute top-3 left-1/2 w-full h-0.5 ${
                    i < currentIdx ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i <= currentIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight ${
                  i <= currentIdx ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{order.type === "person" ? "Lokasi Jemput" : "Toko/Restoran"}</p>
              <p className="font-semibold text-sm">{order.store_name}</p>
              <p className="text-sm text-muted-foreground">{order.store_address}</p>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tujuan</p>
              <p className="font-semibold text-sm">{order.destination_address}</p>
            </div>
          </div>
          {order.notes && (
            <>
              <div className="h-px bg-border" />
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Catatan</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Cost */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold mb-3">Rincian Biaya</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jarak</span>
              <span className="font-medium">{(order.distance_km || 0).toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ongkir</span>
              <span className="font-medium">{formatRupiah(order.delivery_fee)}</span>
            </div>
            {order.item_cost != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga Barang</span>
                <span className="font-medium">{formatRupiah(order.item_cost)}</span>
              </div>
            )}
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>
        </div>

        {/* DRIVER ACTIONS */}
        {isDriver && (
          <div className="bg-card rounded-2xl border-2 border-primary/30 p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Bike className="w-5 h-5 text-primary" /> Aksi Driver
            </h3>

            {order.status === "driver_assigned" && (
              <button
                onClick={() => updateStatus("at_store")}
                disabled={acting}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60"
              >
                {order.type === "person" ? "Saya Sudah di Lokasi Jemput" : order.type === "goods" ? "Saya Sudah di Lokasi Ambil" : "Saya Sudah Sampai di Toko"}
              </button>
            )}

            {order.status === "at_store" && (
              order.type === "food" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Input total bill dari toko/restoran:</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                    <input
                      type="number"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      placeholder="25000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <input
                    value={billNote}
                    onChange={(e) => setBillNote(e.target.value)}
                    placeholder="Catatan bill (opsional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  {isCash ? (
                    <button
                      onClick={() => updateStatus("on_the_way", { item_cost: Number(itemCost) || 0, store_bill_note: billNote })}
                      disabled={acting}
                      className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60"
                    >
                      Mulai Antar ke Tujuan
                    </button>
                  ) : (
                    <button
                      onClick={submitBill}
                      disabled={acting}
                      className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60"
                    >
                      Kirim Bill ke Pengguna
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {order.type === "person" ? "Konfirmasi penumpang sudah naik." : "Konfirmasi paket sudah diambil."}
                  </p>
                  <button
                    onClick={() => (isCash ? updateStatus("on_the_way") : updateStatus("awaiting_payment"))}
                    disabled={acting}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60"
                  >
                    {isCash ? "Mulai Antar ke Tujuan" : "Konfirmasi & Minta Pembayaran"}
                  </button>
                </div>
              )
            )}

            {order.status === "paid" && (
              <button
                onClick={() => updateStatus("on_the_way")}
                disabled={acting}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60"
              >
                Mulai Antar ke Tujuan
              </button>
            )}

            {order.status === "on_the_way" && (
              <button
                onClick={isCash ? settleCash : () => updateStatus("completed")}
                disabled={acting}
                className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60"
              >
                Selesaikan Pesanan
              </button>
            )}

            {order.status === "awaiting_payment" && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Menunggu pengguna membayar...
              </p>
            )}
            {order.status === "completed" && (
              <p className="text-sm text-emerald-600 text-center py-2 font-semibold">
                {isCash ? "Pesanan selesai. Uang tunai diterima, biaya Rp2.000 dipotong dari dompet." : "Pesanan selesai. Penghasilan masuk ke dompet."}
              </p>
            )}
          </div>
        )}

        {/* USER PAY ACTION */}
        {isOwner && order.status === "awaiting_payment" && (
          <div className="bg-gradient-to-br from-primary to-emerald-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Waktunya Membayar
            </h3>
            <p className="text-white/80 text-sm mb-4">
              {order.type === "food"
                ? `Driver sudah beli makanan. Total tagihan ${formatRupiah(total)} (makanan ${formatRupiah(order.item_cost)} + ongkir ${formatRupiah(order.delivery_fee)}).`
                : `Total tagihan ${formatRupiah(order.delivery_fee)} (ongkir antar).`}
            </p>
            <button
              onClick={pay}
              disabled={acting}
              className="w-full bg-white text-primary font-bold py-3.5 rounded-xl hover:bg-white/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {acting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              Bayar {formatRupiah(total)}
            </button>
          </div>
        )}

        {isOwner && order.status === "pending_match" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-700 font-medium">Mencari driver terdekat untuk Anda...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}