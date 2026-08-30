import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2, Banknote } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function AdminRemittance() {
  const [list, setList] = useState(null);
  const [users, setUsers] = useState([]);

  async function load() {
    try {
      const [r, u] = await Promise.all([
        base44.entities.DriverRemittance.filter({}, "-created_date", 200),
        base44.entities.User.list(),
      ]);
      setList(r);
      setUsers(u);
    } catch {
      setList([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u; });
    return m;
  }, [users]);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1 flex items-center gap-2">
        <Banknote className="w-6 h-6 text-primary" /> Setoran Driver
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Bukti setoran fee harian dari driver.</p>

      {list === null ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Belum ada setoran masuk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const u = userMap[r.user_id];
            return (
              <div key={r.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{u?.full_name || u?.email || "Driver"}</p>
                    <p className="text-xs text-muted-foreground">
                      Tgl setoran: {r.date} • {r.transaction_count || 0} transaksi
                    </p>
                  </div>
                  <p className="font-bold text-primary">{formatRupiah(r.amount)}</p>
                </div>
                {r.proof_photo && (
                  <div className="w-32 h-32 mt-3 rounded-lg overflow-hidden border border-border">
                    <a href={r.proof_photo} target="_blank" rel="noreferrer">
                      <Image src={r.proof_photo} fittingType="fit" className="w-full h-full" />
                    </a>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Dikirim: {new Date(r.created_date).toLocaleString("id-ID")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}