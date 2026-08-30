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

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Order</th>
                <th className="text-left font-semibold px-3 py-2">Tgl</th>
                <th className="text-left font-semibold px-3 py-2">Driver</th>
                <th className="text-right font-semibold px-3 py-2">Fee Admin</th>
                <th className="text-right font-semibold px-3 py-2">Fee Layanan</th>
                <th className="text-right font-semibold px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
              const driver = userMap[o.driver_id];
              return (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold selectable">#{String(o.id).slice(-6)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(o.updated_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</td>
                  <td className="px-3 py-2 max-w-[120px] truncate">{driver?.full_name || driver?.email || "—"}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(o.driver_remit_fee || 0)}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(o.service_fee || 0)}</td>
                  <td className="px-3 py-2 text-right font-bold text-primary">{formatRupiah((o.driver_remit_fee || 0) + (o.service_fee || 0))}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
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

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-3 py-2">Driver</th>
              <th className="text-left font-semibold px-3 py-2">Tgl Setoran</th>
              <th className="text-right font-semibold px-3 py-2">Transaksi</th>
              <th className="text-right font-semibold px-3 py-2">Jumlah</th>
              <th className="text-center font-semibold px-3 py-2">Bukti</th>
              <th className="text-left font-semibold px-3 py-2">Dikirim</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
            const u = userMap[r.user_id];
            return (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="px-3 py-2 font-semibold max-w-[120px] truncate">{u?.full_name || u?.email || "Driver"}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.date}</td>
                <td className="px-3 py-2 text-right">{r.transaction_count || 0}</td>
                <td className="px-3 py-2 text-right font-bold text-primary">{formatRupiah(r.amount)}</td>
                <td className="px-3 py-2 text-center">
                  {r.proof_photo ?
                  <a href={r.proof_photo} target="_blank" rel="noreferrer" className="inline-block w-12 h-12 rounded-lg overflow-hidden border border-border">
                      <Image src={r.proof_photo} fittingType="fit" className="w-full h-full" />
                    </a> :
                  <span className="text-muted-foreground">—</span>
                  }
                </td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      }
    </AdminLayout>);

}