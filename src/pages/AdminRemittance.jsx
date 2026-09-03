import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import S from "@/lib/supabaseEntities";
import { formatRupiah } from "@/lib/geo";
import { makassarDateKey, makassarToday } from "@/lib/dateKey";
import { Loader2, Banknote, Wallet, Receipt, AlertTriangle } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function AdminRemittance() {
  const [list, setList] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [completedAt, setCompletedAt] = useState({});

  async function load() {
    try {
      const [r, u, o, wts] = await Promise.all([
      S.DriverRemittance.filter({}, "-created_date", 200),
      base44.entities.User.list(),
      S.Order.filter({ status: "completed" }, "-updated_date", 500),
      S.WalletTransaction.filter({ type: "credit" }, "-created_date", 1000)]
      );
      setList(r);
      setUsers(u);
      setOrders(o);
      // Tanggal selesai stabil dari created_date wallet_transaction credit,
      // tidak ter-bump saat user memberi rating (yang menggeser updated_date).
      const at = {};
      for (const w of wts) {if (w.order_id) at[w.order_id] = w.created_date;}
      setCompletedAt(at);
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

  // Rekap per driver per tanggal (hari lampau) yang belum ada setoran non-rejected.
  const unsettledRows = useMemo(() => {
    const today = makassarToday();
    const settled = {};
    for (const r of list || []) {
      if (r.status === "rejected") continue;
      (settled[r.user_id] ||= new Set()).add(r.date);
    }
    const agg = {};
    for (const o of orders) {
      if (!o.driver_id) continue;
      const d = makassarDateKey(new Date(completedAt[o.id] || o.updated_date));
      if (d >= today) continue;
      if (settled[o.driver_id] && settled[o.driver_id].has(d)) continue;
      const key = `${o.driver_id}|${d}`;
      const row = agg[key] || (agg[key] = { driverId: o.driver_id, date: d, count: 0, adminFee: 0, serviceFee: 0 });
      row.count++;
      row.adminFee += o.driver_remit_fee || 0;
      row.serviceFee += o.service_fee || 0;
    }
    return Object.values(agg).sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.driverId.localeCompare(b.driverId)
    );
  }, [orders, completedAt, list]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold mb-1 flex items-center gap-2 [font-family:'Cabin',_sans-serif]">
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

      {/* Driver belum setor */}
      <div className="mb-6">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" /> Belum Setor Harian
        </h2>
        {unsettledRows.length === 0 ?
        <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Semua driver sudah setor. Tidak ada tunggakan.</p>
          </div> :

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Nama Driver</th>
                <th className="text-left font-semibold px-3 py-2">Tanggal</th>
                <th className="text-right font-semibold px-3 py-2">Jumlah Order</th>
                <th className="text-right font-semibold px-3 py-2">Fee Admin</th>
                <th className="text-right font-semibold px-3 py-2">Fee Layanan</th>
                <th className="text-right font-semibold px-3 py-2">Total Harus Disetor</th>
              </tr>
            </thead>
            <tbody>
              {unsettledRows.map((row) => {
                const u = userMap[row.driverId];
                return (
                  <tr key={`${row.driverId}-${row.date}`} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold max-w-[140px] truncate">{u?.full_name || u?.email || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.date}</td>
                  <td className="px-3 py-2 text-right">{row.count}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(row.adminFee)}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(row.serviceFee)}</td>
                  <td className="px-3 py-2 text-right font-bold text-destructive">{formatRupiah(row.adminFee + row.serviceFee)}</td>
                </tr>);

              })}
            </tbody>
          </table>
        </div>
        }
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
                  <td className="px-3 py-2 text-muted-foreground">{new Date(completedAt[o.id] || o.updated_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</td>
                  <td className="px-3 py-2 max-w-[120px] truncate">{driver?.full_name || driver?.email || "—"}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(o.driver_remit_fee || 0)}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(o.service_fee || 0)}</td>
                  <td className="px-3 py-2 text-right font-bold text-primary">{formatRupiah((o.driver_remit_fee || 0) + (o.service_fee || 0))}</td>
                </tr>);

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
              </tr>);

            })}
          </tbody>
        </table>
      </div>
      }
    </AdminLayout>);

}