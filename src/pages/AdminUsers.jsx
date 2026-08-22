import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [u, d] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.DriverProfile.list(),
        ]);
        setUsers(u);
        setDrivers(d);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const driverIds = useMemo(() => new Set(drivers.map((d) => d.user_id)), [drivers]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const roleBadge = (r) =>
    r === "admin"
      ? "bg-purple-100 text-purple-700"
      : r === "driver"
      ? "bg-blue-100 text-blue-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1">Pengguna</h1>
      <p className="text-muted-foreground text-sm mb-6">Daftar semua akun terdaftar di platform.</p>

      <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 mb-4 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Tidak ada pengguna ditemukan.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-3 bg-secondary/50 text-xs font-semibold text-muted-foreground">
            <div className="col-span-5">Nama</div>
            <div className="col-span-5 hidden sm:block">Email</div>
            <div className="col-span-2 text-right">Peran</div>
          </div>
          {filtered.map((u) => (
            <div key={u.id} className="grid grid-cols-12 px-4 py-3 border-t border-border items-center text-sm">
              <div className="col-span-5 font-medium truncate">{u.full_name || "Tanpa nama"}</div>
              <div className="col-span-5 hidden sm:block text-muted-foreground truncate">{u.email}</div>
              <div className="col-span-2 text-right">
                <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize", roleBadge(u.role))}>
                  {u.role}
                </span>
                {driverIds.has(u.id) && (
                  <span className="ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Driver</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}