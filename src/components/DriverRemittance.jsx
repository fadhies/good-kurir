import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { makassarDateKey, makassarToday } from "@/lib/dateKey";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import PhotoUpload from "@/components/PhotoUpload";
import { Loader2, Banknote, QrCode, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function DriverRemittance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [adminQris, setAdminQris] = useState(null);
  const [groups, setGroups] = useState(null);
  const [proofs, setProofs] = useState({});
  const [submitting, setSubmitting] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [completed, remits, qrisRows] = await Promise.all([
        base44.entities.Order.filter({ driver_id: user.id, status: "completed" }, "-updated_date", 500),
        base44.entities.DriverRemittance.filter({ user_id: user.id }, "-created_date", 200),
        base44.entities.AppSetting.filter({ key: "admin_qris" }, "-created_date", 1),
      ]);
      setAdminQris(qrisRows[0]?.value || null);

      const today = makassarToday();
      const byDate = {};
      for (const o of completed) {
        const d = makassarDateKey(new Date(o.updated_date));
        if (!byDate[d]) byDate[d] = { due: 0, count: 0 };
        byDate[d].due += (o.service_fee || 0) + (o.driver_remit_fee || 0);
        byDate[d].count += 1;
      }
      const remitByDate = {};
      for (const r of remits) {
        if (r.status === "rejected") continue;
        if (!remitByDate[r.date] || new Date(r.created_date) > new Date(remitByDate[r.date].created_date)) {
          remitByDate[r.date] = r;
        }
      }
      const list = Object.entries(byDate)
        .map(([date, v]) => ({
          date,
          due: v.due,
          count: v.count,
          settled: !!remitByDate[date],
          proof: remitByDate[date]?.proof_photo || null,
          overdue: date < today,
        }))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
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
      await base44.entities.DriverRemittance.create({
        user_id: user.id,
        date,
        amount: g.due,
        transaction_count: g.count,
        proof_photo: proof,
        status: "submitted",
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
      <p className="text-sm text-muted-foreground mb-3">
        Setiap hari setor akumulasi fee layanan + Rp1.000/transaksi ke admin via QRIS. Jika belum setor, Anda tidak bisa menerima pesanan baru besok.
      </p>

      <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Total akumulasi yang harus disetor</p>
          <p className="text-xs text-muted-foreground">{unsettled.length} hari belum disetor</p>
        </div>
        <p className="font-display text-2xl font-extrabold text-primary">{formatRupiah(totalDue)}</p>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 mb-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Ada {overdueCount} hari belum disetor — pesanan baru akan diblokir sampai Anda setor.</span>
        </div>
      )}

      {adminQris ? (
        <div className="flex flex-col items-center mb-4">
          <div className="w-40 h-40 rounded-xl overflow-hidden border border-border bg-secondary">
            <Image src={adminQris} fittingType="fit" className="w-full h-full" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">QRIS Admin — scan untuk setor</p>
        </div>
      ) : (
        <p className="text-xs text-amber-600 mb-3">QRIS admin belum diatur. Hubungi admin.</p>
      )}

      {(!groups || groups.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-2">Belum ada setoran jatuh tempo.</p>
      )}

      <div className="space-y-3">
        {groups?.map((g) => (
          <div
            key={g.date}
            className={`rounded-xl border p-3 ${g.settled ? "border-emerald-200 bg-emerald-50" : g.overdue ? "border-amber-300 bg-amber-50" : "border-border"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-semibold text-sm">
                  {g.date}
                  {g.settled ? (
                    <span className="ml-2 text-xs text-emerald-700 font-medium">Lunas</span>
                  ) : g.overdue ? (
                    <span className="ml-2 text-xs text-amber-700 font-medium">Jatuh tempo</span>
                  ) : (
                    <span className="ml-2 text-xs text-muted-foreground font-medium">Hari ini</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{g.count} transaksi • fee layanan + Rp1.000/trx</p>
              </div>
              <p className="font-bold text-primary">{formatRupiah(g.due)}</p>
            </div>
            {g.settled ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Sudah disetor
                {g.proof && (
                  <a href={g.proof} target="_blank" rel="noreferrer" className="underline text-xs">lihat bukti</a>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <PhotoUpload
                  label="Bukti transfer QRIS"
                  value={proofs[g.date] || null}
                  onChange={(v) => setProofs((p) => ({ ...p, [g.date]: v }))}
                />
                <button
                  onClick={() => submit(g.date)}
                  disabled={submitting === g.date || !proofs[g.date]}
                  className="w-full mt-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {submitting === g.date ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  Setor {formatRupiah(g.due)}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}