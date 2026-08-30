import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2 } from "lucide-react";

const STATUS = {
  pending: { label: "Diproses Admin", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700" }
};

export default function WithdrawalList() {
  const { user } = useAuth();
  const [list, setList] = useState(null);

  async function load() {
    try {
      const r = await base44.entities.WithdrawalRequest.filter({ user_id: user.id }, "-created_date", 20);
      setList(r);
    } catch {
      setList([]);
    }
  }

  useEffect(() => {
    load();
    const unsub = base44.entities.WithdrawalRequest.subscribe(() => load());
    return unsub;
  }, []);

  if (list === null) {
    return <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (list.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="font-bold mb-3 hidden">Riwayat Penarikan</h2>
      <div className="space-y-2">
        {list.map((w) => {
          const s = STATUS[w.status] || STATUS.pending;
          return (
            <div key={w.id} className="bg-card rounded-2xl border border-border p-4 hidden">
              <div className="flex items-center justify-between">
                <p className="font-bold">{formatRupiah(w.amount)}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{w.bank_name} • {String(w.account_number).slice(-4)}</p>
              <p className="text-xs text-muted-foreground">{new Date(w.created_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
              {w.status === "rejected" && w.rejection_reason &&
              <p className="text-xs text-red-600 mt-1">Ditolak: {w.rejection_reason}</p>
              }
              {w.status === "completed" &&
              <p className="text-xs text-emerald-600 mt-1">Transfer selesai. Bukti telah diunggah admin.</p>
              }
            </div>);

        })}
      </div>
    </div>);

}