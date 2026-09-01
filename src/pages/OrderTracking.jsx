import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { formatRupiah } from "@/lib/geo";
import { Loader2, Store, MapPin, FileText, Bike, CreditCard, CheckCircle2, Phone, Navigation, X } from "lucide-react";

function mapsUrl(lat, lng, address) {
  const q = lat != null && lng != null ?
  `${lat},${lng}` :
  encodeURIComponent(address || "");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import PhotoUpload from "@/components/PhotoUpload";
import OrderChat from "@/components/OrderChat";
import DriverRating from "@/components/DriverRating";
import { reverseGeocodePoi } from "@/lib/googleMaps";
import { getFunctionError } from "@/lib/functionError";

const TIMELINE = [
{ key: "pending_match", label: "Mencari Driver" },
{ key: "driver_assigned", label: "Driver Menuju Toko" },
{ key: "at_store", label: "Di Toko, memesan" },
{ key: "awaiting_payment", label: "Menunggu Pembayaran" },
{ key: "paid", label: "Pembayaran Selesai" },
{ key: "on_the_way", label: "Dalam Perjalanan" },
{ key: "completed", label: "Selesai" }];


export default function OrderTracking() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemCost, setItemCost] = useState("");
  const [billNote, setBillNote] = useState("");
  const [acting, setActing] = useState(false);
  const [billConfirm, setBillConfirm] = useState(null);
  const [qrisPhoto, setQrisPhoto] = useState(null);
  const [proofPhoto, setProofPhoto] = useState(null);
  const [ownerQris, setOwnerQris] = useState(null);
  const [storeQrisPhoto, setStoreQrisPhoto] = useState(null);
  const [billChoice, setBillChoice] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const prevStatusRef = useRef(null);
  const selfUpdateRef = useRef(false);
  const prevItemCostRef = useRef(null);
  const prevBillNoteRef = useRef(null);

  function markSelfUpdate() {
    selfUpdateRef.current = true;
    setTimeout(() => {selfUpdateRef.current = false;}, 2000);
  }

  function notifyStatusTransition(o) {
    const owner = o.created_by_id === user?.id;
    const driver = o.driver_id === user?.id;
    if (o.status === "awaiting_payment" && owner) {
      toast({ title: "🔔 Tagihan dikirim driver", description: "Silakan lakukan pembayaran sekarang." });
      if (navigator.vibrate) navigator.vibrate(100);
    } else if (o.status === "paid" && driver) {
      toast({ title: "✅ Bukti pembayaran diterima", description: "User sudah bayar, silakan antar ke tujuan." });
      if (navigator.vibrate) navigator.vibrate(100);
    } else if (o.status === "on_the_way" && owner) {
      toast({
        title: "🛵 Driver dalam perjalanan",
        description: o.type === "person" ? "Driver mengantar Anda ke tujuan." : "Pesanan menuju tujuan Anda."
      });
    } else if (o.status === "completed" && owner) {
      toast({ title: "🎉 Pesanan selesai", description: "Terima kasih sudah menggunakan layanan kami." });
    }
  }

  async function confirmBillAction() {
    const cost = Number(itemCost);
    if (!cost || cost <= 0) {
      toast({ title: "Masukkan nominal bill yang valid", variant: "destructive" });
      setBillConfirm(null);
      return;
    }
    setActing(true);
    try {
      markSelfUpdate();
      if (billConfirm === "cash") {
        await S.Order.update(id, {
          status: "on_the_way",
          item_cost: cost,
          store_bill_note: billNote
        });
        notifyDriverStatus("on_the_way");
        toast({ title: "Mulai mengantar ke tujuan" });
      } else {
        if (!user?.phone) {
          toast({ title: "Nomor HP/Dana belum diatur", description: "Lengkapi nomor HP Anda agar pelanggan bisa transfer ke akun Dana Anda.", variant: "destructive" });
          setBillConfirm(null);
          return;
        }
        await S.Order.update(id, {
          status: "awaiting_payment",
          item_cost: cost,
          store_bill_note: billNote,
          driver_dana_number: user.phone
        });
        notifyDriverStatus("awaiting_payment");
        toast({ title: "Tagihan dikirim", description: "Pelanggan akan transfer ke akun Dana Anda." });
      }
      loadOrder();
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
      setBillConfirm(null);
    }
  }

  async function confirmDirectBill() {
    const cost = Number(itemCost);
    if (!cost || cost <= 0) {
      toast({ title: "Masukkan nominal bill yang valid", variant: "destructive" });
      return;
    }
    if (!storeQrisPhoto) {
      toast({ title: "Foto QRIS toko dulu", variant: "destructive" });
      return;
    }
    setActing(true);
    try {
      markSelfUpdate();
      await S.Order.update(id, {
        status: "awaiting_payment",
        item_cost: cost,
        store_bill_note: billNote,
        store_qris_photo: storeQrisPhoto
      });
      notifyDriverStatus("awaiting_payment");
      toast({ title: "Tagihan dikirim", description: "User akan bayar langsung ke toko via QRIS." });
      setBillChoice(null);
      loadOrder();
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  async function loadOrder() {
    try {
      const o = await S.Order.get(id);
      const prev = prevStatusRef.current;
      prevStatusRef.current = o.status;
      setOrder(o);
      // Hanya isi ulang input dari server saat nilai tersimpan berubah,
      // agar input yang sedang diketik driver tidak terus-terusan direset oleh polling.
      if (o.item_cost !== prevItemCostRef.current) {
        setItemCost(o.item_cost ? String(o.item_cost) : "");
        prevItemCostRef.current = o.item_cost;
      }
      if (o.store_bill_note !== prevBillNoteRef.current) {
        setBillNote(o.store_bill_note || "");
        prevBillNoteRef.current = o.store_bill_note;
      }
      if (prev && prev !== o.status && !selfUpdateRef.current) {
        notifyStatusTransition(o);
      }
    } catch (e) {
      // Hanya tampilkan error saat load pertama (sebelum pernah berhasil);
      // pada polling ulang (mis. saat idle) cukup diam agar toast tidak spam
      // dan data lama tetap tampil. prevStatusRef terisi hanya setelah load sukses.
      if (prevStatusRef.current === null) toast({ title: "Pesanan tidak ditemukan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    const unsub = S.Order.subscribe((event) => {
      if (event.id === id) loadOrder();
    });
    const poll = setInterval(loadOrder, 3000);
    const onWake = () => { if (!document.hidden) loadOrder(); };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);
    return () => {unsub();clearInterval(poll);document.removeEventListener("visibilitychange", onWake);window.removeEventListener("online", onWake);};
  }, [id]);

  // Ambil QRIS pemilik (setting admin) untuk pembayaran
  useEffect(() => {
    base44.entities.AppSetting.filter({ key: "owner_qris" }, "-created_date", 1).
    then((rows) => setOwnerQris(rows[0]?.value || null)).
    catch(() => {});
  }, []);

  // Enrich store_name: bila masih berupa pecahan alamat, ambil nama POI dari koordinat toko
  useEffect(() => {
    if (!order?.id || order.store_lat == null || order.store_lng == null) return;
    const firstFragment = (order.store_address || "").split(",")[0].trim();
    if (order.store_name && order.store_name !== firstFragment) return;
    let active = true;
    reverseGeocodePoi(order.store_lat, order.store_lng).then(({ name }) => {
      if (!active || !name || name === order.store_name) return;
      S.Order.
      update(order.id, { store_name: name }).
      then(() => setOrder((prev) => prev ? { ...prev, store_name: name } : prev)).
      catch(() => {});
    });
    return () => {active = false;};
  }, [order?.id, order?.store_name, order?.store_address, order?.store_lat, order?.store_lng]);

  const role = user?.role || "user";
  const isDriver = order?.driver_id === user?.id;
  const isOwner = order?.created_by_id === user?.id;

  // Buat record notifikasi (ke lonceng) untuk pihak yang tidak melakukan aksi.
  // Backend function memakai service_role agar bisa membuat notifikasi ke user
  // lain (RLS Notification melarang driver membuat notifikasi untuk user lain).
  function notifyDriverStatus(status) {
    base44.functions.invoke("notifyOrderStatus", { orderId: id, status }).catch(() => {});
  }

  async function updateStatus(status, extra = {}) {
    setActing(true);
    try {
      markSelfUpdate();
      await S.Order.update(id, { status, ...extra });
      notifyDriverStatus(status);
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
      markSelfUpdate();
      await S.Order.update(id, {
        status: "awaiting_payment",
        item_cost: cost,
        store_bill_note: billNote
      });
      notifyDriverStatus("awaiting_payment");
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
      const res = await base44.functions.invoke("payOrder", { orderId: id, proofPhoto: proofPhoto || null });
      if (res.data?.success) {
        toast({ title: "Pembayaran terkonfirmasi", description: "Bukti terkirim ke driver." });
        loadOrder();
      } else {
        toast({ title: "Gagal", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal", description: getFunctionError(e), variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  async function cancelOrder() {
    setActing(true);
    try {
      markSelfUpdate();
      await S.Order.update(id, { status: "cancelled" });
      toast({ title: "Pesanan dibatalkan" });
      setCancelOpen(false);
      loadOrder();
    } catch (e) {
      toast({ title: "Gagal membatalkan", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  async function settleOrder() {
    setActing(true);
    try {
      markSelfUpdate();
      const res = await base44.functions.invoke("completeOrderPayment", { orderId: id });
      if (res.data?.success) {
        toast({
          title: "Pesanan selesai",
          description: "Pendapatan masuk ke dompet driver. Setor fee layanan + Rp1.000 ke admin via QRIS di menu Dompet."
        });
        loadOrder();
      } else {
        toast({ title: "Gagal menyelesaikan", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal", description: getFunctionError(e), variant: "destructive" });
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
      </Layout>);

  }

  if (!order) {
    return (
      <Layout>
        <p className="text-center py-20 text-muted-foreground">Pesanan tidak ditemukan.</p>
      </Layout>);

  }

  const isCash = order.payment_method === "cash";
  const isQris = order.payment_method === "qris";
  // Label khusus mode antar orang agar kontekstual (jemput → antar → sampai).
  const personLabels = {
    driver_assigned: "Driver Menuju Jemput",
    at_store: "Di Lokasi Jemput",
    on_the_way: "Mengantar ke Tujuan",
    completed: "Sampai di Tujuan"
  };
  const labeledTimeline = TIMELINE.map((t) => {
  if (order.type === "person" && personLabels[t.key]) return { ...t, label: personLabels[t.key] };
  if (t.key === "at_store") return { ...t, label: order.type === "goods" ? "Di Lokasi Ambil" : "Di Toko, Memesan" };
  return t;
  });
  const timeline = isQris && order.type === "food" ?
  labeledTimeline :
  labeledTimeline.filter((t) => t.key !== "awaiting_payment" && t.key !== "paid");
  const currentIdx = timeline.findIndex((t) => t.key === order.status);
  const total = (order.item_cost || 0) + (order.delivery_fee || 0) + (order.service_fee || 0);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold selectable">Pesanan #{String(order.id).slice(-6)}</h1>
          <p className="text-sm text-muted-foreground capitalize">{order.type === "food" ? "Beli Makanan" : order.type === "goods" ? "Antar Barang" : "Antar Orang"}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-start overflow-x-auto scrollbar-hide">
          {timeline.map((t, i) =>
          <div key={t.key} className="flex flex-col items-center flex-1 min-w-[60px] relative">
              {i < timeline.length - 1 &&
            <div
              className={`absolute top-3 left-1/2 w-full h-0.5 bg-[hsl(var(--chart-4))] ${
              i < currentIdx ? "" : "bg-border"}`
              } />

            }
              <div
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-[hsl(var(--chart-4))] ${
              i <= currentIdx ?
              "text-primary-foreground" :
              "bg-secondary text-muted-foreground"}`
              }>
              
                {i < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
              className={`text-[10px] mt-1.5 text-center leading-tight text-[hsl(var(--popover-foreground))] ${
              i <= currentIdx ? "font-semibold" : "text-muted-foreground"}`
              }>
              
                {t.label}
              </span>
            </div>
          )}
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
              <a
                href={mapsUrl(order.store_lat, order.store_lng, order.store_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline selectable inline-flex items-center gap-1 break-all text-[hsl(var(--popover-foreground))]">
                
                <Navigation className="w-3.5 h-3.5 shrink-0" /> {order.store_address}
              </a>
              {order.store_detail &&
              <p className="text-sm text-muted-foreground mt-1 selectable">📍 {order.store_detail}</p>
              }
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-[hsl(var(--primary))]" />
            <div>
              <p className="text-xs text-muted-foreground">Tujuan</p>
              <a
                href={mapsUrl(order.destination_lat, order.destination_lng, order.destination_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sm underline selectable inline-flex items-center gap-1 break-all text-[hsl(var(--popover-foreground))]">
                
                <Navigation className="w-3.5 h-3.5 shrink-0" /> {order.destination_address}
              </a>
              {order.destination_detail &&
              <p className="text-sm text-muted-foreground mt-1 selectable">{order.destination_detail}</p>
              }
            </div>
          </div>
          {order.notes &&
          <>
              <div className="h-px bg-border" />
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{order.type === "food" ? "Rincian Pesanan" : "Catatan"}</p>
                  <p className="text-sm whitespace-pre-wrap selectable">{order.notes}</p>
                </div>
              </div>
            </>
          }
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee Layanan (10%)</span>
              <span className="font-medium">{formatRupiah(order.service_fee)}</span>
            </div>
            {order.item_cost != null &&
            <div className="flex justify-between">
                <span className="text-muted-foreground">Harga Barang</span>
                <span className="font-medium">{formatRupiah(order.item_cost)}</span>
              </div>
            }
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>
        </div>

        {/* CHAT */}
        <OrderChat order={order} />

        {/* DRIVER ACTIONS */}
        {isDriver &&
        <div className="bg-card rounded-2xl border-2 border-primary/30 p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Bike className="w-5 h-5 text-primary" /> Aksi Driver
            </h3>

            {order.status === "driver_assigned" &&
          <button
            onClick={() => updateStatus("at_store")}
            disabled={acting}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
            
                {order.type === "person" ? "Saya Sudah di Lokasi Jemput" : order.type === "goods" ? "Saya Sudah di Lokasi Ambil" : "Saya Sudah Sampai di Toko"}
              </button>
          }

            {order.status === "at_store" && (
          order.type === "food" ?
          <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Input total bill dari toko/restoran:</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                    <input
                type="number"
                value={itemCost}
                onChange={(e) => setItemCost(e.target.value)}
                placeholder="25000"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              
                  </div>
                  <input
              value={billNote}
              onChange={(e) => setBillNote(e.target.value)}
              placeholder="Catatan bill (opsional)"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            
                  {isCash ?
            <button
              onClick={() => setBillConfirm("cash")}
              disabled={acting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
              
                      Konfirmasi & Mulai Antar
                    </button> :

            <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Pilih metode pembayaran tagihan toko:</p>
                      <button
                type="button"
                onClick={() => {setBillChoice("talangi");setStoreQrisPhoto(null);}}
                disabled={acting}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors disabled:opacity-60 ${
                billChoice === "talangi" ?
                "border-primary bg-primary/5" :
                "border-border hover:bg-secondary/50"}`
                }>
                
                        <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${billChoice === "talangi" ? "border-primary" : "border-muted-foreground/40"}`}>
                          {billChoice === "talangi" && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </span>
                        <span>
                          <span className="block font-semibold text-sm">Saya Talangi</span>
                          <span className="block text-xs text-muted-foreground">Pelanggan akan mengisi saldo Dana saya untuk bayar tagihan resto/toko.</span>
                        </span>
                      </button>
                      <button
                type="button"
                onClick={() => setBillChoice("direct")}
                disabled={acting}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors disabled:opacity-60 ${
                billChoice === "direct" ?
                "border-primary bg-primary/5" :
                "border-border hover:bg-secondary/50"}`
                }>
                
                        <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${billChoice === "direct" ? "border-primary" : "border-muted-foreground/40"}`}>
                          {billChoice === "direct" && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </span>
                        <span>
                          <span className="block font-semibold text-sm">Pelanggan Bayar Langsung</span>
                          <span className="block text-xs text-muted-foreground">Pelanggan scan QRIS toko & bayar langsung; ongkir tunai ke saya.</span>
                        </span>
                      </button>
                      {billChoice === "talangi" &&
              <button
                onClick={() => setBillConfirm("qris")}
                disabled={acting || !Number(itemCost)}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
                
                          Kirim Tagihan
                        </button>
              }
                      {billChoice === "direct" &&
              <div className="space-y-3 pt-1">
                          <p className="text-xs text-muted-foreground">
                            Foto QRIS toko/resto untuk dikirim ke pelanggan. Pastikan nama merchant terlihat jelas.
                          </p>
                          <PhotoUpload
                  label="Foto QRIS Toko/Resto"
                  value={storeQrisPhoto}
                  onChange={setStoreQrisPhoto}
                  hint="Pastikan QRIS menampilkan nama merchant toko." />
                
                          <button
                  onClick={confirmDirectBill}
                  disabled={acting || !storeQrisPhoto}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
                  
                            Kirim Tagihan ke User
                          </button>
                        </div>
              }
                    </div>
            }
                </div> :

          <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {order.type === "person" ? "Konfirmasi penumpang sudah naik." : "Konfirmasi paket sudah diambil."}
                  </p>
                  <button
              onClick={() => updateStatus("on_the_way")}
              disabled={acting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
              
                    Mulai Antar ke Tujuan
                  </button>
                </div>)

          }

            {order.status === "paid" &&
          <div className="space-y-3">
                {order.payment_proof_photo &&
            <div>
                    <p className="text-sm font-semibold mb-1.5">Bukti pembayaran user:</p>
                    <div className="w-full max-w-xs rounded-xl overflow-hidden border border-border bg-secondary">
                      <Image src={order.payment_proof_photo} fittingType="fit" className="w-full h-auto" />
                    </div>
                  </div>
            }
                <button
              onClick={() => updateStatus("on_the_way")}
              disabled={acting}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
              
                  Mulai Antar ke Tujuan
                </button>
              </div>
          }

            {order.status === "on_the_way" &&
          <p className="text-sm text-muted-foreground text-center py-2">
                {order.type === "person" ? "Menunggu penumpang konfirmasi sudah sampai di tujuan..." : "Menunggu pemesan mengonfirmasi pesanan sudah diterima..."}
              </p>
          }

            {order.status === "awaiting_payment" &&
          <p className="text-sm text-muted-foreground text-center py-2">
                {isQris ? "Menunggu user scan QRIS & kirim bukti bayar..." : "Menunggu pengguna membayar..."}
              </p>
          }
            {order.status === "completed" &&
          <p className="text-sm text-emerald-600 text-center py-2 font-semibold">
                Pesanan selesai. Pendapatan penuh masuk ke dompet Anda. Jangan lupa setor fee layanan + Rp1.000 ke admin.
              </p>
          }
          </div>
        }

        {/* USER PAY ACTION */}
        {isOwner && order.status === "awaiting_payment" && (
        isQris && order.type === "food" ?
        <div className="bg-card rounded-2xl border-2 border-primary/30 p-5 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> {order.store_qris_photo ? "Bayar Tagihan Toko" : "Bayar ke Akun Dana Driver"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Total tagihan: <span className="font-semibold text-foreground">
                  {formatRupiah(order.store_qris_photo ? order.item_cost : order.item_cost + order.delivery_fee + order.service_fee)}
                </span>
              </p>
              {order.store_qris_photo ?
          <>
                  <p className="text-xs text-muted-foreground">
                    Scan QRIS toko di bawah, bayar tagihan toko langsung ke toko. Ongkir {formatRupiah(order.delivery_fee)} dibayar tunai ke driver saat pesanan tiba.
                  </p>
                  <div className="w-full max-w-xs mx-auto rounded-xl overflow-hidden border border-border bg-secondary">
                    <Image src={order.store_qris_photo} fittingType="fit" className="w-full h-auto" />
                  </div>
                </> :
          order.driver_dana_number ?
          <>
                  <p className="text-xs text-muted-foreground">
                    Driver menalangi pembayaran toko. Transfer total tagihan (tagihan toko + ongkir) ke akun Dana driver di bawah, lalu unggah bukti top-up.
                  </p>
                  <div className="rounded-xl border border-border bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Nomor HP / Akun Dana Driver</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="font-bold text-lg tracking-wide selectable">{order.driver_dana_number}</p>
                      <button
                  type="button"
                  onClick={() => {
                    try {navigator.clipboard?.writeText(order.driver_dana_number);} catch {}
                    toast({ title: "Nomor Dana disalin" });
                  }}
                  className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5">
                  
                        Salin
                      </button>
                    </div>
                  </div>
                </> :

          <>
                  <p className="text-xs text-muted-foreground">
                    Scan QRIS di bawah, bayar tagihan toko + ongkir. Dana masuk ke dompet driver (tagihan toko + ongkir − biaya admin).
                  </p>
                  {ownerQris ?
            <div className="w-full max-w-xs mx-auto rounded-xl overflow-hidden border border-border bg-secondary">
                      <Image src={ownerQris} fittingType="fit" className="w-full h-auto" />
                    </div> :

            <p className="text-sm text-amber-600 text-center">QRIS pemilik belum diatur admin.</p>
            }
                </>
          }
              <PhotoUpload
            label="Bukti pembayaran"
            value={proofPhoto}
            onChange={setProofPhoto}
            hint="Unggah bukti transfer/screenshot pembayaran." />
          
              <button
            onClick={pay}
            disabled={acting || !proofPhoto}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            
                {acting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {order.store_qris_photo ? "Saya Sudah Bayar, Kirim Bukti" : "Saya Sudah Transfer, Kirim Bukti"}
              </button>
            </div> :

        <div className="bg-gradient-to-br from-primary to-emerald-700 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-1 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Waktunya Membayar
              </h3>
              <p className="text-white/80 text-sm mb-4">
                Total ongkir {formatRupiah(order.delivery_fee)} dibayar ke driver setelah pesanan sampai.
              </p>
              <button
            onClick={pay}
            disabled={acting}
            className="w-full bg-white text-primary font-bold py-3.5 rounded-xl hover:bg-white/90 disabled:opacity-60 flex items-center justify-center gap-2">
            
                {acting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                Konfirmasi
              </button>
            </div>)

        }

        {isOwner && order.status === "pending_match" &&
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-1" />
            <p className="text-sm text-amber-700 font-medium">Menunggu driver menerima pesanan Anda...</p>
            <button
          onClick={() => setCancelOpen(true)}
          disabled={acting}
          className="w-full bg-destructive text-destructive-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              Batalkan Pesanan
            </button>
          </div>
        }

        {isOwner && order.status === "on_the_way" &&
        <div className="bg-emerald-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold mb-1">{order.type === "person" ? "Sudah Sampai Tujuan?" : "Pesanan Sudah Sampai?"}</h3>
            <p className="text-white/80 text-sm mb-4">{order.type === "person" ? "Konfirmasi bahwa Anda sudah sampai di tujuan untuk menyelesaikan order." : "Konfirmasi bahwa pesanan sudah Anda terima untuk menyelesaikan order."}</p>
            <button
            onClick={settleOrder}
            disabled={acting}
            className="w-full bg-white text-primary font-bold py-3.5 rounded-xl hover:bg-white/90 disabled:opacity-60 flex items-center justify-center gap-2">
            
              {acting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Selesaikan Pesanan
            </button>
          </div>
        }

        {isOwner && order.status === "completed" && order.driver_id &&
        <DriverRating order={order} onRated={loadOrder} />
        }
      </div>

      {/* Konfirmasi batalkan pesanan */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Pesanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesanan yang sedang mencari driver akan dibatalkan. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Jangan Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelOrder}
              disabled={acting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {acting ? "Memproses..." : "Ya, Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi tagihan di restoran */}
      <AlertDialog open={!!billConfirm} onOpenChange={(o) => !o && setBillConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Tagihan</AlertDialogTitle>
            <AlertDialogDescription>
              {Number(itemCost) > 0 ?
              `Kirim tagihan sebesar Rp ${Number(itemCost).toLocaleString("id-ID")}${billNote ? ` (${billNote})` : ""}?${billConfirm === "cash" ? " Driver langsung mengantar ke tujuan." : " Pengguna akan scan QRIS pemilik & kirim bukti bayar."}` :
              "Masukkan nominal bill dulu sebelum konfirmasi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBillAction} disabled={acting || !Number(itemCost)}>
              {acting ? "Memproses..." : "Ya, Konfirmasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>);

}