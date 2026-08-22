import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import LocationPicker from "@/components/GoogleLocationPicker";
import { base44 } from "@/api/base44Client";
import { haversineKm, calcDeliveryFee, formatRupiah } from "@/lib/geo";
import { Bike, Package, User, Loader2, ArrowLeft, ShoppingBag, MapPin, FileText, Route } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TYPES = {
  food: { label: "Beli Makanan", icon: Bike, accent: "24 90% 55%" },
  goods: { label: "Antar Barang", icon: Package, accent: "158 64% 40%" },
  person: { label: "Antar Orang", icon: User, accent: "217 91% 50%" },
};

export default function NewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const [type, setType] = useState(params.get("type") || "food");
  const [mode, setMode] = useState("hemat");
  const [store, setStore] = useState(null);
  const [destination, setDestination] = useState(null);
  const [notes, setNotes] = useState("");
  const [destDetail, setDestDetail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashAvailable, setCashAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    base44.functions
      .invoke("checkCashAvailable", {})
      .then((res) => setCashAvailable(!!res.data?.available))
      .catch(() => setCashAvailable(false));
  }, []);

  useEffect(() => {
    if (!cashAvailable && paymentMethod === "cash") setPaymentMethod("gopay");
  }, [cashAvailable, paymentMethod]);

  const distance = useMemo(() => {
    if (store?.lat && destination?.lat) {
      return haversineKm(store.lat, store.lng, destination.lat, destination.lng);
    }
    return null;
  }, [store, destination]);

  const deliveryFee = distance != null ? calcDeliveryFee(distance, mode, type) : 0;

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
        if (type === "food") setDestination(loc);
        else setStore(loc);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => { active = false; };
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
      const order = await base44.entities.Order.create({
        user_id: user.id,
        type,
        mode,
        payment_method: paymentMethod,
        store_name: store.address.split(",")[0],
        store_address: store.address,
        store_lat: store.lat,
        store_lng: store.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        destination_detail: destDetail,
        notes,
        status: "pending_match",
        delivery_fee: deliveryFee,
        distance_km: distance ? Math.round(distance * 100) / 100 : 0,
      });

      try {
        const res = await base44.functions.invoke("matchNearestDriver", {
          orderId: order.id,
        });
        if (res.data?.driver_id) {
          toast({ title: "Driver ditemukan!", description: `Driver ${Math.round(res.data.distance_km * 10) / 10} km dari toko` });
        } else {
          toast({ title: "Order dibuat, mencari driver...", description: res.data?.error || "Driver akan segera dihubungi" });
        }
      } catch (matchErr) {
        // 404 = belum ada driver eligible (offline/belum verifikasi/saldo kurang).
        // Order tetap tersimpan; pengguna diarahkan ke halaman pelacakan.
        let msg = "Belum ada driver tersedia saat ini";
        try {
          const parsed = JSON.parse(matchErr?.message || "{}");
          if (parsed?.error) msg = parsed.error;
        } catch {}
        toast({ title: "Order dibuat, mencari driver...", description: msg });
      }
      navigate(`/pesanan/${order.id}`);
    } catch (e) {
      toast({ title: "Gagal membuat pesanan", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const currentType = TYPES[type];

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <h1 className="font-display text-2xl font-extrabold mb-1">Buat Pesanan</h1>
      <p className="text-muted-foreground text-sm mb-6">Pilih layanan, tentukan toko & tujuan, lalu kami carikan driver terdekat.</p>

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {Object.entries(TYPES).map(([key, t]) => {
          const Icon = t.icon;
          const active = type === key;
          return (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode selector / Tarif info */}
      {type === "food" ? (
        <div className="mb-6">
          <h3 className="font-bold mb-2 text-sm">Mode Pengantaran</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "hemat", l: "Hemat", desc: "Rp7.000 / 4km", per: "+Rp1.000/km" },
              { v: "cepat", l: "Cepat", desc: "Rp12.000 / 4km", per: "+Rp2.000/km" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setMode(o.v)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  mode === o.v ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span className={`text-sm font-bold ${mode === o.v ? "text-primary" : ""}`}>{o.l}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                <p className="text-[10px] text-muted-foreground">{o.per} setelahnya</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-secondary/50 rounded-2xl border border-border p-4">
          <h3 className="font-bold mb-1 text-sm">Tarif Antar</h3>
          <p className="text-sm text-muted-foreground">Rp12.000 untuk 4 km pertama, +Rp2.000/km setelahnya.</p>
        </div>
      )}

      {/* Payment method */}
      <div className="mb-6">
        <h3 className="font-bold mb-2 text-sm">Metode Pembayaran</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: "gopay", l: "GoPay" },
            { v: "dana", l: "Dana" },
            { v: "qris", l: "QRIS" },
            { v: "cash", l: "Tunai" },
          ].map((o) => {
            const active = paymentMethod === o.v;
            const disabled = o.v === "cash" && !cashAvailable;
            return (
              <button
                key={o.v}
                disabled={disabled}
                onClick={() => setPaymentMethod(o.v)}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                  active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span className={`block text-xs font-bold ${active ? "text-primary" : ""}`}>{o.l}</span>
              </button>
            );
          })}
        </div>
        {paymentMethod === "cash" && (
          <p className="text-xs text-muted-foreground mt-2">
            Driver menerima uang tunai saat pesanan sampai. Biaya layanan Rp2.000 dipotong dari dompet driver.
          </p>
        )}
        {!cashAvailable && (
          <p className="text-xs text-destructive mt-2">
            Pembayaran tunai tidak tersedia (tidak ada driver dengan saldo dompet cukup).
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Store */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold">
              {type === "person" ? "Lokasi Jemput" : "Toko / Restoran"}
            </h3>
          </div>
          <LocationPicker
            label={type === "person" ? "Di mana penumpang?" : "Cari toko atau restoran"}
            value={store}
            onChange={setStore}
            accent={currentType.accent}
            biasCenter={userLoc}
          />
        </div>

        {/* Destination */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-bold">Tujuan</h3>
          </div>
          <LocationPicker
            label="Tujuan pengantaran"
            value={destination}
            onChange={setDestination}
            accent="158 64% 45%"
            biasCenter={userLoc}
          />
          <div className="mt-3">
            <label className="text-sm font-semibold text-foreground/80 block mb-1.5">Detil alamat (catatan untuk driver)</label>
            <input
              value={destDetail}
              onChange={(e) => setDestDetail(e.target.value)}
              placeholder="Mis: Rumah cat hijau, pintu kayu, sebelah warung"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-bold">{type === "food" ? "Tuliskan rincian pesanan" : "Catatan untuk Driver"}</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={
              type === "food"
                ? "Mis: Nasi goreng ayam 1 porsi, level pedas, pakai telur"
                : type === "goods"
                ? "Mis: Paket berupa dokumen, tolong hati-hati"
                : "Mis: Penumpang 1 orang, bawa tas kecil"
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Summary */}
        {distance != null && (
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Route className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-primary">Ringkasan</h3>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Jarak toko → tujuan</span>
              <span className="font-semibold">{(Math.round(distance * 10) / 10).toFixed(1)} km</span>
            </div>
            {type === "food" && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-semibold">{mode === "cepat" ? "Cepat" : "Hemat"}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Pembayaran</span>
              <span className="font-semibold capitalize">
                {paymentMethod === "cash" ? "Tunai" : paymentMethod}
              </span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Ongkir</span>
              <span className="font-semibold">{formatRupiah(deliveryFee)}</span>
            </div>
            {type === "food" && (
              <p className="text-xs text-muted-foreground mt-2">
                *Harga barang dibayar terpisah setelah driver beli di toko
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-lg shadow-primary/30 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Mencari driver...
            </>
          ) : (
            "Cari Driver Sekarang"
          )}
        </button>
      </div>
    </Layout>
  );
}