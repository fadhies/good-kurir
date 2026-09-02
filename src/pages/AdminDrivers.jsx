import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, Bike, BadgeCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
{ key: "pending", label: "Menunggu" },
{ key: "approved", label: "Disetujui" },
{ key: "rejected", label: "Ditolak" }];


export default function AdminDrivers() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [d, u] = await Promise.all([
      S.DriverProfile.list("-created_date", 200),
      base44.entities.User.list()]
      );
      setDrivers(d);
      setUsers(u);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {load();}, []);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => {m[u.id] = u;});
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    return drivers.
    filter((d) => d.verification_status === tab).
    filter((d) => {
      if (!search) return true;
      const u = userMap[d.user_id];
      const q = search.toLowerCase();
      return (
        (u?.full_name || "").toLowerCase().includes(q) ||
        (u?.email || "").toLowerCase().includes(q) ||
        (d.license_plate || "").toLowerCase().includes(q));

    });
  }, [drivers, tab, search, userMap]);

  async function setVerification(driver, status) {
    setActing(driver.id);
    try {
      await S.DriverProfile.update(driver.id, { verification_status: status });
      toast({ title: status === "approved" ? "Driver disetujui" : "Driver ditolak" });
      load();
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold mb-1 [font-family:'Cabin',_sans-serif]">Verifikasi Driver</h1>
      <p className="text-muted-foreground text-sm mb-6">Periksa KTP & selfie, lalu setujui atau tolak pendaftar.</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-card border border-border rounded-xl p-1">
          {TABS.map((t) =>
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            
              {t.label}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, plat..."
            className="flex-1 bg-transparent text-sm outline-none" />
          
        </div>
      </div>

      {loading ?
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> :
      filtered.length === 0 ?
      <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <Bike className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Tidak ada driver pada kategori ini.</p>
        </div> :

      <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((d) => {
          const u = userMap[d.user_id];
          return (
            <div key={d.id} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{u?.full_name || "Tanpa nama"}</p>
                    <p className="text-sm text-muted-foreground truncate">{u?.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                    {d.vehicle_type === "motorcycle" ? "Motor" : "Mobil"} • {d.license_plate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Foto KTP</p>
                    {d.ktp_photo ?
                  <Image src={d.ktp_photo} alt="KTP" className="w-full h-28 rounded-lg border border-border" fittingType="fill" /> :

                  <div className="w-full h-28 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground">Belum ada</div>
                  }
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Selfie + KTP</p>
                    {d.selfie_with_ktp ?
                  <Image src={d.selfie_with_ktp} alt="Selfie KTP" className="w-full h-28 rounded-lg border border-border" fittingType="fill" /> :

                  <div className="w-full h-28 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground">Belum ada</div>
                  }
                  </div>
                </div>

                {d.verification_status === "rejected" && d.rejection_reason &&
              <p className="text-xs text-red-600 mb-3">Alasan: {d.rejection_reason}</p>
              }

                {tab === "pending" &&
              <div className="flex gap-2">
                    <button
                  onClick={() => setVerification(d, "approved")}
                  disabled={acting === d.id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60">
                  
                      <CheckCircle2 className="w-4 h-4" /> Setujui
                    </button>
                    <button
                  onClick={() => setVerification(d, "rejected")}
                  disabled={acting === d.id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60">
                  
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </div>
              }
                {tab === "approved" &&
              <button
                onClick={() => setVerification(d, "pending")}
                disabled={acting === d.id}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60">
                
                    <BadgeCheck className="w-4 h-4" /> Kembalikan ke Menunggu
                  </button>
              }
                {tab === "rejected" &&
              <button
                onClick={() => setVerification(d, "pending")}
                disabled={acting === d.id}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60">
                
                    Tinjau ulang
                  </button>
              }
              </div>);

        })}
        </div>
      }
    </AdminLayout>);

}