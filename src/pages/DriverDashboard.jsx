import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import LocationPicker from "@/components/LocationPicker";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2, Bike, Power, Crosshair, MapPin, ChevronRight, Star, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [locModal, setLocModal] = useState(false);
  const [tempLoc, setTempLoc] = useState(null);

  async function loadProfile() {
    try {
      const list = await base44.entities.DriverProfile.filter({ user_id: user.id });
      setProfile(list[0] || null);
    } catch (e) {
      setProfile(null);
    } finally {
      setChecking(false);
    }
  }

  async function loadOrders() {
    if (!profile) return;
    try {
      const active = await base44.entities.Order.filter(
        { driver_id: user.id, status: { $in: ["driver_assigned", "at_store", "awaiting_payment", "paid", "on_the_way"] } },
        "-created_date",
        20
      );
      setOrders(active);
    } catch (e) {
      setOrders([]);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    loadOrders();
    const unsub = base44.entities.Order.subscribe(() => loadOrders());
    return unsub;
  }, [profile]);

  async function toggleOnline() {
    try {
      const updated = await base44.entities.DriverProfile.update(profile.id, {
        is_online: !profile.is_online,
        is_available: !profile.is_online ? true : profile.is_available,
      });
      setProfile(updated);
      toast({ title: updated.is_online ? "Anda online" : "Anda offline" });
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    }
  }

  async function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await res.json();
          setTempLoc({ lat: latitude, lng: longitude, address: data.display_name });
        } catch {
          setTempLoc({ lat: latitude, lng: longitude, address: `${latitude}, ${longitude}` });
        }
      },
      () => toast({ title: "Tidak bisa mengakses lokasi", variant: "destructive" })
    );
  }

  async function saveLocation() {
    if (!tempLoc) return;
    try {
      const updated = await base44.entities.DriverProfile.update(profile.id, {
        current_lat: tempLoc.lat,
        current_lng: tempLoc.lng,
        current_address: tempLoc.address,
      });
      setProfile(updated);
      setLocModal(false);
      toast({ title: "Lokasi diperbarui" });
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    }
  }

  if (checking) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold mb-1">Anda belum terdaftar sebagai driver</p>
          <p className="text-sm text-muted-foreground mb-4">Daftar dulu untuk mulai menerima pesanan.</p>
          <button
            onClick={() => navigate("/jadi-driver")}
            className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl"
          >
            Daftar Jadi Driver
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-extrabold mb-1">Dashboard Driver</h1>
      <p className="text-muted-foreground text-sm mb-6">Kelola ketersediaan & lihat pesanan masuk.</p>

      {/* Status card */}
      <div className={`rounded-2xl p-5 mb-4 ${profile.is_online ? "bg-gradient-to-br from-primary to-emerald-700 text-white" : "bg-card border border-border"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profile.is_online ? "bg-white/20" : "bg-secondary"}`}>
              <Bike className={`w-6 h-6 ${profile.is_online ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className={`font-bold ${profile.is_online ? "text-white" : ""}`}>{profile.is_online ? "Online" : "Offline"}</p>
              <p className={`text-sm ${profile.is_online ? "text-white/80" : "text-muted-foreground"}`}>
                {profile.vehicle_type === "motorcycle" ? "Motor" : "Mobil"} • {profile.license_plate}
              </p>
            </div>
          </div>
          <button
            onClick={toggleOnline}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm ${
              profile.is_online ? "bg-white text-primary" : "bg-primary text-primary-foreground"
            }`}
          >
            <Power className="w-4 h-4" />
            {profile.is_online ? "Offline" : "Online"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className={`rounded-xl p-3 text-center ${profile.is_online ? "bg-white/15" : "bg-secondary"}`}>
            <p className={`text-lg font-bold ${profile.is_online ? "text-white" : ""}`}>{profile.total_trips || 0}</p>
            <p className={`text-xs ${profile.is_online ? "text-white/80" : "text-muted-foreground"}`}>Trip</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${profile.is_online ? "bg-white/15" : "bg-secondary"}`}>
            <p className={`text-lg font-bold flex items-center justify-center gap-0.5 ${profile.is_online ? "text-white" : ""}`}>
              <Star className="w-3.5 h-3.5 fill-current" /> {(profile.rating || 5).toFixed(1)}
            </p>
            <p className={`text-xs ${profile.is_online ? "text-white/80" : "text-muted-foreground"}`}>Rating</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${profile.is_online ? "bg-white/15" : "bg-secondary"}`}>
            <p className={`text-lg font-bold ${profile.is_online ? "text-white" : ""}`}>{orders.length}</p>
            <p className={`text-xs ${profile.is_online ? "text-white/80" : "text-muted-foreground"}`}>Orderan Aktif</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <button
        onClick={() => {
          setTempLoc(profile.current_lat ? { lat: profile.current_lat, lng: profile.current_lng, address: profile.current_address } : null);
          setLocModal(true);
        }}
        className="w-full bg-card rounded-2xl border border-border p-4 mb-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
      >
        <MapPin className="w-5 h-5 text-primary" />
        <div className="flex-1 text-left">
          <p className="text-xs text-muted-foreground">Lokasi saat ini</p>
          <p className="text-sm font-medium truncate">{profile.current_address || "Belum diatur"}</p>
        </div>
        <span className="text-xs font-semibold text-primary">Ubah</span>
      </button>

      {/* Active orders */}
      <div>
        <h2 className="font-bold mb-3">Pesanan Aktif</h2>
        {orders.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada pesanan aktif</p>
            <p className="text-xs text-muted-foreground mt-1">{profile.is_online ? "Tunggu pesanan masuk..." : "Aktifkan mode online untuk menerima pesanan"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => navigate(`/pesanan/${o.id}`)}
                className="w-full text-left bg-card rounded-2xl border border-border p-4 hover:border-primary/40 transition-all flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{o.store_name}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">→ {o.destination_address}</p>
                  <p className="text-sm font-semibold text-primary mt-1">Ongkir {formatRupiah(o.delivery_fee)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location modal */}
      {locModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Atur Lokasi Driver</h3>
              <button onClick={() => setLocModal(false)} className="text-muted-foreground">✕</button>
            </div>
            <button
              onClick={useMyLocation}
              className="w-full mb-3 inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2.5 rounded-xl"
            >
              <Crosshair className="w-4 h-4" /> Gunakan lokasi saya
            </button>
            <LocationPicker label="Posisi" value={tempLoc} onChange={setTempLoc} accent="158 64% 30%" />
            <button
              onClick={saveLocation}
              className="w-full mt-4 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90"
            >
              Simpan Lokasi
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}