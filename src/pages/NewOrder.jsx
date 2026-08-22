import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import LocationPicker from "@/components/LocationPicker";
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
  const [store, setStore] = useState(null);
  const [destination, setDestination] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const distance = useMemo(() => {
    if (store?.lat && destination?.lat) {
      return haversineKm(store.lat, store.lng, destination.lat, destination.lng);
    }
    return null;
  }, [store, destination]);

  const deliveryFee = distance != null ? calcDeliveryFee(distance) : 0;

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
        store_name: store.address.split(",")[0],
        store_address: store.address,
        store_lat: store.lat,
        store_lng: store.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        notes,
        status: "pending_match",
        delivery_fee: deliveryFee,
        distance_km: distance ? Math.round(distance * 100) / 100 : 0,
      });

      const res = await base44.functions.invoke("matchNearestDriver", {
        orderId: order.id,
      });

      if (res.data?.driver_id) {
        toast({ title: "Driver ditemukan!", description: `Driver ${Math.round(res.data.distance_km * 10) / 10} km dari toko` });
      } else {
        toast({ title: "Order dibuat, mencari driver...", description: res.data?.error || "Driver akan segera dihubungi" });
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
          />
        </div>

        {/* Notes */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-bold">Catatan untuk Driver</h3>
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
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Ongkir</span>
              <span className="font-semibold">{formatRupiah(deliveryFee)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              *Harga barang dibayar terpisah setelah driver beli di toko
            </p>
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