import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Users, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  async function changeRole(userId, role) {
    setUpdatingId(userId);
    try {
      await base44.entities.User.update(userId, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast({ title: "Peran diperbarui", description: `Sekarang: ${role}.` });
    } catch (e) {
      toast({ title: "Gagal mengubah peran", description: e.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [u, d] = await Promise.all([
          base44.entities.User.list(),
          S.DriverProfile.list(),
        ]);
        setUsers(u);
        setDrivers(d);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const driverIds = useMemo(
    () => new Set(drivers.filter((d) => d.verification_status === "approved").map((d) => d.user_id)),
    [drivers]
  );

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Email tidak valid", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      await base44.users.inviteUser(email, inviteRole);
      toast({ title: "Undangan terkirim", description: `Link pendaftaran admin dikirim ke ${email}.` });
      setInviteOpen(false);
      setInviteEmail("");
    } catch (e) {
      toast({ title: "Gagal mengundang", description: e.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  }

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
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold mb-1">Pengguna</h1>
          <p className="text-muted-foreground text-sm">Daftar semua akun terdaftar di platform.</p>
        </div>
        <Button onClick={() => { setInviteRole("admin"); setInviteOpen(true); }} className="shrink-0">
          <UserPlus className="w-4 h-4 mr-1.5" /> Undang Admin
        </Button>
      </div>

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
              <div className="col-span-2 flex items-center justify-end gap-1">
                <Select
                  value={u.role}
                  disabled={updatingId === u.id}
                  onValueChange={(r) => changeRole(u.id, r)}
                >
                  <SelectTrigger className="h-7 w-24 px-2 text-xs capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="driver">driver</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
                {driverIds.has(u.id) && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Driver</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undang Admin Baru</DialogTitle>
            <DialogDescription>
              Masukkan email. Penerima akan dikirangi link pendaftaran; setelah selesai mendaftar, akun otomatis jadi admin.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="admin@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            disabled={inviting}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Batal</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Kirim Undangan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}