import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { formatRupiah } from "@/lib/geo";
import { makassarDateKey, makassarToday } from "@/lib/dateKey";
import { useToast } from "@/components/ui/use-toast";
import PhotoUpload from "@/components/PhotoUpload";
import { Loader2, Banknote, Smartphone, AlertTriangle, CheckCircle2, Copy } from "lucide-react";

export default function DriverRemittance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [adminDana, setAdminDana] = useState("");
  const [groups, setGroups] = useState(null);
  const [proofs, setProofs] = useState({});
  const [submitting, setSubmitting] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [completed, remits, qrisRows, wts] = await Promise.all([
      S.Order.filter({ driver_id: user.id, status: "completed" }, "-updated_date", 500),
      S.DriverRemittance.filter({ user_id: user.id }, "-created_date", 200),
      base44.entities.AppSetting.filter({ key: "admin_dana_number" }, "-created_date", 1),
      S.WalletTransaction.filter({ user_id: user.id, type: "credit" }, "-created_date", 500)]
      );
      setAdminDana(qrisRows[0]?.value || "");

      // Tanggal selesai pakai created_date wallet_transaction credit — dibuat
      // sekali saat order selesai (completeOrderPayment) dan tidak pernah diubah,
      // jadi tidak ikut ter-bump saat user memberi rating. Fallback updated_date
      // untuk order tanpa record dompet.
      const completedAt = {};
      for (const w of wts) { if (w.order_id) completedAt[w.order_id] = w.created_date; }

      const today = makassarToday();
      const byDate = {};
      for (const o of completed) {
        const d = makassarDateKey(new Date(completedAt[o.id] || o.updated_date));
        if (!byDate[d]) byDate[d] = { due: 0, count: 0, serviceFee: 0, adminFee: 0 };
        byDate[d].due += (o.service_fee || 0) + (o.driver_remit_fee || 0);
        byDate[d].serviceFee += o.service_fee || 0;
        byDate[d].adminFee += o.driver_remit_fee || 0;
        byDate[d].count += 1;
      }
      const remitByDate = {};
      for (const r of remits) {
        if (r.status === "rejected") continue;
        if (!remitByDate[r.date] || new Date(r.created_date) > new Date(remitByDate[r.date].created_date)) {
          remitByDate[r.date] = r;
        }
      }
      const list = Object.entries(byDate).
      map(([date, v]) => ({
        date,
        due: v.due,
        count: v.count,
        serviceFee: v.serviceFee,
        adminFee: v.adminFee,
        settled: !!remitByDate[date],
        proof: remitByDate[date]?.proof_photo || null,
        overdue: date < today
      })).
      sort((a, b) => a.date < b.date ? 1 : -1);
      setGroups(list);
    } catch (e) {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  async function submit(date) {
    const proof = proofs[date];
    if (!proof) {
      toast({ title: "Upload bukti transfer dulu", variant: "destructive" });
      return;
    }
    const g = groups.find((x) => x.date === date);
    setSubmitting(date);
    try {
      await S.DriverRemittance.create({
        user_id: user.id,
        date,
        amount: g.due,
        transaction_count: g.count,
        proof_photo: proof,
        status: "submitted"
      });
      toast({ title: "Setoran terkirim", description: "Terima kasih, setoran tercatat." });
      setProofs((p) => ({ ...p, [date]: null }));
      load();
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const unsettled = (groups || []).filter((g) => !g.settled);
  const overdueCount = unsettled.filter((g) => g.overdue).length;
  const totalDue = unsettled.reduce((s, g) => s + g.due, 0);

  return (
    <div className="mt-6 bg-card rounded-2xl border border-border p-5">
      <h2 className="font-bold mb-1 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-primary" /> Setor Fee ke Admin
      </h2>
      <p className="text-sm text-muted-foreground mb-3">Setiap hari wajib setor Rp1.000/order + fee layanan ke admin. Jika belum setor, Anda tidak bisa menerima pesanan baru besok.

      </p>

      <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Total akumulasi yang harus disetor</p>
          <p className="text-xs text-muted-foreground">{unsettled.length} hari belum disetor</p>
        </div>
        <p className="font-display text-2xl font-extrabold text-primary">{formatRupiah(totalDue)}</p>
      </div>

      {overdueCount > 0 &&
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 mb-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Ada {overdueCount} hari belum disetor — pesanan baru akan diblokir sampai Anda setor.</span>
        </div>
      }

      {adminDana ?
      <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Transfer setoran ke DANA Admin</p>
              <p className="font-bold text-base text-primary selectable tracking-wide">{adminDana}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(adminDana);
              toast({ title: "Nomor DANA disalin" });
            }}
            className="p-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors shrink-0"
            title="Salin nomor"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div> :

      <p className="text-xs text-amber-600 mb-3">Nomor DANA admin belum diatur. Hubungi admin.</p>
      }

      {(!groups || groups.length === 0) &&
      <p className="text-sm text-muted-foreground text-center py-2">Belum ada setoran jatuh tempo.</p>
      }

      <div className="space-y-3">
        {groups?.map((g) =>
        <div
          key={g.date}
          className={`rounded-xl border p-3 ${g.settled ? "border-emerald-200 bg-emerald-50" : g.overdue ? "border-amber-300 bg-amber-50" : "border-border"}`}>
          
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-semibold text-sm">
                  {g.date}
                  {g.settled ?
                <span className="ml-2 text-xs text-emerald-700 font-medium">Lunas</span> :
                g.overdue ?
                <span className="ml-2 text-xs text-amber-700 font-medium">Jatuh tempo</span> :

                <span className="ml-2 text-xs text-muted-foreground font-medium">Hari ini</span>
                }
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                  <p>Order ada {g.count} </p>
                  <div className="flex justify-between gap-2"><span>Fee admin</span><span>{formatRupiah(g.adminFee)}</span></div>
                  <div className="flex justify-between gap-2"><span>Fee layanan</span><span>{formatRupiah(g.serviceFee)}</span></div>
                </div>
              </div>
              <p className="font-bold text-primary">{formatRupiah(g.due)}</p>
            </div>
            {g.settled ?
          <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Sudah disetor
                {g.proof &&
            <a href={g.proof} target="_blank" rel="noreferrer" className="underline text-xs">lihat bukti</a>
            }
              </div> :

          <div className="mt-2">
                <PhotoUpload
              label="Bukti transfer DANA"
              value={proofs[g.date] || null}
              onChange={(v) => setProofs((p) => ({ ...p, [g.date]: v }))} />
            
                <button
              onClick={() => submit(g.date)}
              disabled={submitting === g.date || !proofs[g.date]}
              className="w-full mt-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
              
                  {submitting === g.date ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                  Setor {formatRupiah(g.due)}
                </button>
              </div>
          }
          </div>
        )}
      </div>
    </div>);

}