import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2, Banknote, Wallet, Receipt } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function AdminRemittance() {
  const [list, setList] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  async function load() {
    try {
      const [r, u, o] = await Promise.all([
      base44.entities.DriverRemittance.filter({}, "-created_date", 200),
      base44.entities.User.list(),
      base44.entities.Order.filter({ status: "completed" }, "-updated_date", 500)]
      );
      setList(r);
      setUsers(u);
      setOrders(o);
    } catch {
      setList([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => {m[u.id] = u;});
    return m;
  }, [users]);

  const totals = useMemo(() => {
    let adminFee = 0;
    let serviceFee = 0;
    for (const o of orders) {
      adminFee += o.driver_remit_fee || 0;
      serviceFee += o.service_fee || 0;
    }
    return { adminFee, serviceFee, total: adminFee + serviceFee };
  }, [orders]);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1 flex items-center gap-2">
        <Banknote className="w-6 h-6 text-primary" /> Penghasilan Admin
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Akumulasi fee admin (Rp1.000/order) + fee layanan dari semua order selesai.</p>

      {/* Balance card */}
      <div className="rounded-2xl p-5 mb-6 bg-[#EAF01C] text-stone-900">
        <div className="flex items-center gap-2 text-sm mb-2 text-[hsl(var(--foreground))]">
          <Wallet className="w-4 h-4" /> Total Penghasilan Admin
        </div>
        <p className="font-display text-4xl font-extrabold mb-3">{formatRupiah(totals.total)}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/15 px-3 py-2">
            <p className="text-xs text-[hsl(var(--foreground))]">Fee Admin (Rp1.000 × {orders.length})</p>
            <p className="font-bold">{formatRupiah(totals.adminFee)}</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2">
            <p className="text-xs text-[hsl(var(--foreground))]">Fee Layanan</p>
            <p className="font-bold">{formatRupiah(totals.serviceFee)}</p>
          </div>
        </div>
      </div>

      {/* Transaction detail */}
      <div className="mb-6">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" /> Rincian Transaksi
        </h2>
        {orders.length === 0 ?
        <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Belum ada order selesai.</p>
          </div> :

        <div className="space-y-2">
            {orders.map((o) => {
            const driver = userMap[o.driver_id];
            return (
              <div key={o.id} className="bg-card rounded-xl border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-semibold selectable">#{String(o.id).slice(-6)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.updated_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    Driver: {driver?.full_name || driver?.email || "—"}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fee Admin</span>
                    <span className="font-medium text-foreground">{formatRupiah(o.driver_remit_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fee Layanan</span>
                    <span className="font-medium text-foreground">{formatRupiah(o.service_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-primary pt-1.5 border-t border-border mt-1.5">
                    <span>Total</span>
                    <span>{formatRupiah((o.driver_remit_fee || 0) + (o.service_fee || 0))}</span>
                  </div>
                </div>);

          })}
          </div>
        }
      </div>

      {/* Bukti setoran dari driver */}
      <h2 className="font-bold mb-3 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-primary" /> Bukti Setoran Driver
      </h2>
      {list === null ?
      <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> :
      list.length === 0 ?
      <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Belum ada setoran masuk.</p>
        </div> :

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
                {r.proof_photo &&
              <div className="w-32 h-32 mt-3 rounded-lg overflow-hidden border border-border">
                    <a href={r.proof_photo} target="_blank" rel="noreferrer">
                      <Image src={r.proof_photo} fittingType="fit" className="w-full h-full" />
                    </a>
                  </div>
              }
                <p className="text-xs text-muted-foreground mt-2">
                  Dikirim: {new Date(r.created_date).toLocaleString("id-ID")}
                </p>
              </div>);

        })}
        </div>
      }
    </AdminLayout>);

}