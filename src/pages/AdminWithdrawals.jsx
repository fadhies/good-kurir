import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PhotoUpload from "@/components/PhotoUpload";
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
import { Label } from "@/components/ui/label";

const STATUS = {
  pending: { label: "Menunggu", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
};

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const [list, setList] = useState(null);
  const [users, setUsers] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [proof, setProof] = useState(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  async function load() {
    try {
      const [reqs, us] = await Promise.all([
        base44.entities.WithdrawalRequest.list("-created_date", 100),
        base44.entities.User.list(),
      ]);
      setList(reqs);
      setUsers(us);
    } catch {
      setList([]);
    }
  }

  useEffect(() => {
    load();
    const unsub = base44.entities.WithdrawalRequest.subscribe(() => load());
    return unsub;
  }, []);

  function userName(id) {
    const u = users.find((x) => x.id === id);
    return u ? (u.full_name || u.email) : "Driver";
  }

  async function process() {
    if (!processing) return;
    setActing(true);
    try {
      const payload = { request_id: processing.request.id, action: processing.action };
      if (processing.action === "complete") payload.transfer_proof_photo = proof;
      if (processing.action === "reject") payload.rejection_reason = reason;
      const res = await base44.functions.invoke("processWithdrawal", payload);
      if (res.data?.success) {
        toast({ title: processing.action === "complete" ? "Penarikan diselesaikan" : "Penarikan ditolak & dikembalikan" });
        setProcessing(null);
        setProof(null);
        setReason("");
        load();
      } else {
        toast({ title: "Gagal", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1">Penarikan Driver</h1>
      <p className="text-muted-foreground text-sm mb-6">Proses permintaan penarikan saldo driver.</p>

      {list === null ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Belum ada permintaan penarikan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((w) => {
            const s = STATUS[w.status] || STATUS.pending;
            return (
              <div key={w.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold">{userName(w.user_id)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                </div>
                <p className="text-2xl font-extrabold text-primary">{formatRupiah(w.amount)}</p>
                <p className="text-sm text-muted-foreground mt-1">{w.bank_name} • {w.account_number}</p>
                {w.account_holder_name && <p className="text-sm text-muted-foreground">a.n. {w.account_holder_name}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(w.created_date).toLocaleString("id-ID")}</p>
                {w.status === "completed" && w.transfer_proof_photo && (
                  <p className="text-xs text-emerald-600 mt-1">Bukti transfer sudah diunggah.</p>
                )}
                {w.status === "rejected" && w.rejection_reason && (
                  <p className="text-xs text-red-600 mt-1">Ditolak: {w.rejection_reason}</p>
                )}
                {w.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setProcessing({ request: w, action: "complete" }); setProof(null); }}
                      className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-2 rounded-xl"
                    >
                      Proses & Unggah Bukti
                    </button>
                    <button
                      onClick={() => { setProcessing({ request: w, action: "reject" }); setReason(""); }}
                      className="flex-1 bg-secondary text-secondary-foreground text-sm font-semibold py-2 rounded-xl"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!processing} onOpenChange={(o) => !o && setProcessing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{processing?.action === "complete" ? "Selesaikan Penarikan" : "Tolak Penarikan"}</DialogTitle>
            <DialogDescription>
              {processing?.action === "complete"
                ? `Unggah bukti transfer ${formatRupiah(processing?.request.amount)} ke ${processing?.request.bank_name} ${processing?.request.account_number}.`
                : `Saldo ${formatRupiah(processing?.request.amount)} akan dikembalikan ke dompet driver.`}
            </DialogDescription>
          </DialogHeader>
          {processing?.action === "complete" ? (
            <div className="py-2"><PhotoUpload label="Bukti Transfer" value={proof} onChange={setProof} /></div>
          ) : (
            <div className="py-2">
              <Label>Alasan Penolakan (opsional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Mis: Nomor rekening tidak valid" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessing(null)} disabled={acting}>Batal</Button>
            <Button onClick={process} disabled={acting || (processing?.action === "complete" && !proof)}>
              {acting ? "Memproses..." : processing?.action === "complete" ? "Selesaikan" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}