import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import LocationPicker from "@/components/GoogleLocationPicker";
import PullToRefresh from "@/components/PullToRefresh";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { haversineKm, formatRupiah } from "@/lib/geo";
import { getTariffs, computeDeliveryFee, computeServiceFee, DEFAULT_TARIFFS } from "@/lib/tariffs";
import { Bike, Package, Utensils, Loader2, MapPin, FileText, Route, Tags, Banknote, Wallet, CircleCheck, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TYPES = {
  food: { label: "Beli Makanan", icon: Utensils, accent: "217 91% 50%" },
  person: { label: "Antar Orang", icon: Bike, accent: "24 90% 55%" },
  goods: { label: "Antar Barang", icon: Package, accent: "158 64% 40%" }
};

export default function NewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const [type, setType] = useState(params.get("type") || "food");

  // Tab pesan tetap ter-mount, jadi sinkronkan tipe setiap kali param
  // ?type= berubah (mis. dari kartu layanan di Beranda).
  useEffect(() => {
    const t = params.get("type");
    if (t && TYPES[t]) setType(t);
  }, [params]);

  const [mode, setMode] = useState("hemat");
  const [store, setStore] = useState(null);
  const [destination, setDestination] = useState(null);
  const [notes, setNotes] = useState("");
  const [destDetail, setDestDetail] = useState("");
  const [storeDetail, setStoreDetail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashAvailable, setCashAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);

  useEffect(() => {
    getTariffs().then(setTariffs).catch(() => {});
  }, []);

  useEffect(() => {
    base44.functions.
    invoke("checkCashAvailable", {}).
    then((res) => setCashAvailable(!!res.data?.available)).
    catch(() => setCashAvailable(false));
  }, []);

  useEffect(() => {
    if (!cashAvailable && paymentMethod === "cash" && type === "food") setPaymentMethod("qris");
  }, [cashAvailable, paymentMethod, type]);

  async function refresh() {
    getTariffs().then(setTariffs).catch(() => {});
    base44.functions.
    invoke("checkCashAvailable", {}).
    then((res) => setCashAvailable(!!res.data?.available)).
    catch(() => setCashAvailable(false));
  }

  useEffect(() => {
    if (type !== "food" && paymentMethod === "qris") setPaymentMethod("cash");
  }, [type, paymentMethod]);

  const distance = useMemo(() => {
    if (store?.lat && destination?.lat) {
      return haversineKm(store.lat, store.lng, destination.lat, destination.lng);
    }
    return null;
  }, [store, destination]);

  const deliveryFee = distance != null ? computeDeliveryFee(tariffs, distance, mode, type) : 0;
  const serviceFee = computeServiceFee(tariffs, deliveryFee);
  const driverRemitFee = Number(tariffs.driver_remit_per_txn ?? 0);
  const activeTariff = type === "food" ? tariffs.food[mode] : tariffs[type];

  // Default lokasi berdasarkan GPS user:
  // - food: tujuan = lokasi user
  // - goods/person: lokasi jemput = lokasi user
  useEffect(() => {
    let active = true;
    setStore(null);
    setDestination(null);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        } catch {}
        if (!active) return;
        const loc = { lat: latitude, lng: longitude, address };
        setUserLoc({ lat: latitude, lng: longitude });
        if (type === "food") setDestination(loc);else
        setStore(loc);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => {active = false;};
  }, [type]);

  async function handleSubmit() {
    if (!store) {
      toast({ title: "Pilih toko/restoran dulu", variant: "destructive" });
      return;
    }
    if (!destination) {
      toast({ title: "Pilih tujuan dulu", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Cek apakah ada driver yang bisa melayani mode pengantaran terpilih
      const check = await base44.functions.invoke("checkModeDriver", { mode, paymentMethod });
      if (check.data && !check.data.available) {
        toast({
          title: "Driver dengan mode yang Anda pilih belum tersedia",
          description: check.data.reason,
          variant: "destructive"
        });
        return;
      }

      const order = await S.Order.create({
        user_id: user.id,
        type,
        mode,
        payment_method: paymentMethod,
        store_name: store.name || store.address.split(",")[0],
        store_address: store.address,
        store_detail: storeDetail,
        store_lat: store.lat,
        store_lng: store.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        destination_detail: destDetail,
        notes,
        status: "pending_match",
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        driver_remit_fee: driverRemitFee,
        distance_km: distance ? Math.round(distance * 100) / 100 : 0
      });

      toast({ title: "Pesanan dibuat", description: "Menunggu driver menerima pesanan Anda..." });
      navigate(`/pesanan/${order.id}`);
      // Beri tahu driver yang online: ada orderan baru
      base44.functions.invoke("notifyNewOrder", { orderId: order.id }).catch(() => {});
    } catch (e) {
      toast({ title: "Gagal membuat pesanan", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const currentType = TYPES[type];
  const detailInputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400";

  return (
    <Layout>
      <PullToRefresh onRefresh={refresh}>
      <h1 className="text-base font-extrabold text-foreground tracking-tight leading-tight">Buat Pesanan</h1>
      <p className="text-[11px] text-muted-foreground font-medium mb-4">Lengkapi rincian perjalanan Anda</p>

      <div className="space-y-4">
        {/* 3. Kartu lokasi jemput & tujuan */}
        <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
          {/* Lokasi jemput / resto */}
          <div className="flex items-stretch gap-3">
            <div className="flex flex-col items-center w-8 shrink-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-current" />
              </div>
              <div className="w-[2px] flex-1 border-l-2 border-dashed border-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">
                {type === "food" ? "Resto/Toko" : "Lokasi Jemput"}
              </label>
              <LocationPicker
                  label={type === "food" ? "cari Restoran/Toko" : "cari atau pin lokasi jemput"}
                  value={store}
                  onChange={setStore}
                  accent={currentType.accent}
                  biasCenter={userLoc} />

              <div className="mt-2">
                <input
                    value={storeDetail}
                    onChange={(e) => setStoreDetail(e.target.value)}
                    placeholder={`Detil ${type === "food" ? "resto/toko" : "lokasi jemput"} (opsional)`}
                    className={detailInputCls} />

              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 shrink-0 flex justify-center">
              <div className="w-[2px] h-4 border-l-2 border-dashed border-slate-300" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 shrink-0 flex justify-center">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1.5">Lokasi Tujuan</label>
              <LocationPicker
                  label="Tujuan pengantaran"
                  value={destination}
                  onChange={setDestination}
                  accent="158 64% 45%"
                  biasCenter={userLoc} />

              <div className="mt-2">
                <input
                    value={destDetail}
                    onChange={(e) => setDestDetail(e.target.value)}
                    placeholder="Detil alamat (opsional)"
                    className={detailInputCls} />

              </div>
            </div>
          </div>
        </div>

        {/* Rincian Pesanan */}
        <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
          <label className="block text-xs font-bold text-foreground mb-1.5">
            {type === "food" ? "Rincian pesanan (opsional)" : "Catatan untuk Driver (opsional)"}
          </label>
          <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={
              type === "food" ?
              "Mis: Nasi goreng ayam 1 porsi, level pedas, pakai telur" :
              type === "goods" ?
              "Mis: Paket berupa dokumen, tolong hati-hati" :
              "Mis: Penumpang 1 orang, bawa tas kecil"
              }
              className={`${detailInputCls} resize-none`} />

        </div>

        {/* Ongkos Kirim: mode pengantaran + keterangan tarif */}
        <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            

              
            <h3 className="text-xs font-bold text-foreground">Ongkos Kirim</h3>
          </div>
          {type === "food" &&
            <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center gap-1 mb-3">
            {[
              { v: "hemat", l: "Hemat" },
              { v: "cepat", l: "Cepat" }].
              map((o) =>
              <button
                key={o.v}
                onClick={() => setMode(o.v)}
                className={`flex-1 py-2.5 px-2 rounded-xl transition-all flex items-center justify-center ${
                mode === o.v ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-slate-600 hover:text-slate-900"}`
                }>
                
                <span className="text-xs font-bold leading-tight">{o.l}</span>
              </button>
              )}
          </div>
            }
          <p className="text-[11px] text-emerald-700">
            <span className="font-bold">Rp{(activeTariff?.base ?? 0).toLocaleString("id-ID")}</span> ({activeTariff?.base_km ?? 0} km pertama), +Rp{(activeTariff?.per_km ?? 0).toLocaleString("id-ID")}/km berikutnya.
          </p>
        </div>

        {/* Metode Pembayaran */}
        <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
          <label className="block text-xs font-bold text-foreground mb-2">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "cash", l: "Tunai", sub: "Bayar ke driver", Icon: Banknote },
              { v: "qris", l: "Non Tunai", Icon: Wallet }].
              map((o) => {
                const active = paymentMethod === o.v;
                const disabled = o.v === "cash" && !cashAvailable || o.v === "qris" && type !== "food";
                const Icon = o.Icon;
                return (
                  <button
                    key={o.v}
                    disabled={disabled}
                    onClick={() => setPaymentMethod(o.v)}
                    className={`p-3 rounded-2xl flex items-center justify-between text-left transition-all ${
                    active ? "border-2 border-emerald-600 bg-emerald-50/50" : "border border-slate-200 bg-background hover:border-slate-300"} ${
                    disabled ? "opacity-40 cursor-not-allowed" : ""}`}>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-emerald-600" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">{o.l}</p>
                      {o.sub && <p className="text-[10px] text-muted-foreground truncate">{o.sub}</p>}
                    </div>
                  </div>
                  {active && <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>);

              })}
          </div>
          {paymentMethod === "cash" &&
            <p className="text-xs text-muted-foreground mt-2">
              Pelanggan membayar ke driver setelah pesanan selesai.
            </p>
            }
          {paymentMethod === "qris" &&
            <p className="text-xs text-muted-foreground mt-2">
              Pelanggan bayar langsung ke toko/resto atau transfer ke driver.
            </p>
            }
          {!cashAvailable &&
            <p className="text-xs text-destructive mt-2">
              Pembayaran tunai tidak tersedia (tidak ada driver online saat ini).
            </p>
            }
        </div>

        {/* 6. Ringkasan */}
        {distance != null &&
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Route className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-primary">Ringkasan</h3>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Jarak {type === "food" ? "toko" : "jemput"} → tujuan</span>
              <span className="font-semibold">{(Math.round(distance * 10) / 10).toFixed(1)} km</span>
            </div>
            {type === "food" &&
            <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-semibold">{mode === "cepat" ? "Cepat" : "Hemat"}</span>
              </div>
            }
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Pembayaran</span>
              <span className="font-semibold">
                {paymentMethod === "cash" ? "Tunai" : "QRIS"}
              </span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Ongkir</span>
              <span className="font-semibold">{formatRupiah(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Fee Layanan ({tariffs.service_fee_percent}%)</span>
              <span className="font-semibold">{formatRupiah(serviceFee)}</span>
            </div>
            {type === "food" &&
            <p className="text-xs text-muted-foreground mt-2">
                *Harga barang dibayar terpisah setelah driver beli di toko
              </p>
            }
          </div>
          }

        {/* 7. Bar estimasi biaya & tombol pesan */}
        <div className="bg-slate-900 text-white rounded-3xl p-4 flex items-center justify-between gap-4 shadow-xl shadow-slate-900/10">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Biaya</p>
            <p className="text-xl font-extrabold leading-tight">
              {distance != null ? formatRupiah(deliveryFee + serviceFee) : "—"}
            </p>
            {distance != null &&
              <p className="text-[10px] text-slate-400">Ongkir + fee layanan</p>}
          </div>
          <button
              onClick={handleSubmit}
              disabled={submitting}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-60 whitespace-nowrap">

            {submitting ?
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Mencari driver...
              </> :

              <>
                Pesan Sekarang <ArrowRight className="w-4 h-4" />
              </>
              }
          </button>
        </div>
      </div>
      </PullToRefresh>
    </Layout>);

}