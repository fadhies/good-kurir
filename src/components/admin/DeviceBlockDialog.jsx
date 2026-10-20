import React, { useEffect, useState } from "react";
import S from "@/lib/supabaseEntities";
import { base44 } from "@/api/base44Client";
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
import { Loader2, Ban, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Dialog blokir/buka blokir ID perangkat milik seorang pengguna, dikelola
// admin dari halaman Pengguna. Blokir disimpan per perangkat, bukan per akun.
export default function DeviceBlockDialog({ user, onClose, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]); // device_id dari pesanan pengguna ini
  const [blocked, setBlocked] = useState([]); // baris blokir terkait device di atas
  const [deviceId, setDeviceId] = useState("");
  const [manualId, setManualId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const [ordersRes, listRes] = await Promise.allSettled([
        S.Order.filter({ user_id: user.id }, "-created_date", 20),
        base44.functions.invoke("deviceBlock", { op: "list" }),
      ]);
      const orders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
      const allBlocked = listRes.status === "fulfilled" ? (listRes.data?.data || []) : [];
      const ids = [...new Set(orders.map((o) => o.device_id).filter(Boolean))];
      setDevices(ids);
      setBlocked(allBlocked.filter((b) => ids.includes(b.device_id)));
      setDeviceId(ids[0] || "");
      setReason("");
      setManualId("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  async function blockDevice(id) {
    const reasonTrim = reason.trim();
    if (!reasonTrim) return;
    setBusy(true);
    try {
      await base44.functions.invoke("deviceBlock", { op: "block", deviceId: id, reason: reasonTrim });
      await load();
      onChanged && onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function unblockDevice(id) {
    setBusy(true);
    try {
      await base44.functions.invoke("deviceBlock", { op: "unblock", deviceId: id });
      await load();
      onChanged && onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blokir Perangkat</DialogTitle>
          <DialogDescription>
            Perangkat yang diblokir tidak bisa membuat pesanan, sekalipun membuat akun baru. Blokir disimpan pada ID perangkat, bukan akun.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : devices.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tidak ada ID perangkat tercatat dari pesanan pengguna ini. Masukkan ID perangkat secara manual (jika ada).</p>
            <Input
              placeholder="ID perangkat (mis. 3f2a...)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {devices.map((id) => {
              const b = blocked.find((x) => x.device_id === id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate selectable">{id}</p>
                    {b ? (
                      <p className="text-xs text-destructive">Diblokir: {b.reason}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Tidak diblokir</p>
                    )}
                  </div>
                  {b ? (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => unblockDevice(id)}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Buka Blokir
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy || !deviceId || deviceId !== id || !reason.trim()}
                      onClick={() => blockDevice(id)}
                      className={cn(deviceId !== id && "opacity-50")}
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" /> Blokir
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && (devices.length > 0 || manualId.trim()) && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Alasan pemblokiran</label>
            <Input
              placeholder="Mis. menyalahgunakan layanan"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        {devices.length === 0 && manualId.trim() && (
          <Button
            disabled={busy || !reason.trim()}
            onClick={() => blockDevice(manualId.trim())}
            className="bg-destructive hover:bg-destructive/90"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Ban className="w-4 h-4 mr-1.5" />}
            Blokir Perangkat
          </Button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}