import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
import { Loader2, Wallet, ArrowDownLeft, ArrowUpRight, Banknote } from "lucide-react";
import WithdrawalDialog from "@/components/WithdrawalDialog";
import WithdrawalList from "@/components/WithdrawalList";

export default function DriverWallet() {
  const { user } = useAuth();
  const [txns, setTxns] = useState(null);
  const [balance, setBalance] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  async function load() {
    try {
      const list = await base44.entities.WalletTransaction.filter({ user_id: user.id }, "-created_date", 50);
      setTxns(list);
      const bal = list.reduce((acc, t) => acc + (t.type === "credit" ? t.amount : -t.amount), 0);
      setBalance(bal);
    } catch (e) {
      setTxns([]);
    }
  }

  useEffect(() => {
    load();
    const unsub = base44.entities.WalletTransaction.subscribe(() => load());
    return unsub;
  }, []);

  return (
    <Layout>
      <h1 className="font-display text-2xl font-extrabold mb-1">{user?.role === "admin" ? "Dompet Admin" : "Dompet Driver"}</h1>
      <p className="text-muted-foreground text-sm mb-6">Penghasilan Anda dari setiap pesanan.</p>

      {/* Balance card */}
      <div className="rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
            <Wallet className="w-4 h-4" /> Saldo Tersedia
          </div>
          <p className="font-display text-4xl font-extrabold">{formatRupiah(balance)}</p>
          <button
            onClick={() => setWithdrawOpen(true)}
            disabled={balance < 10000}
            className="mt-3 inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 disabled:opacity-50 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
          >
            <Banknote className="w-4 h-4" /> Tarik Saldo
          </button>
          <p className="text-white/70 text-xs mt-2">Minimal saldo tersisa Rp10.000 saat menarik</p>
        </div>
      </div>

      {/* Transactions */}
      <h2 className="font-bold mt-6 mb-3">Riwayat Transaksi</h2>
      {txns === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : txns.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
          <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
          <p className="text-xs text-muted-foreground mt-1">Selesaikan pesanan untuk dapat penghasilan.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {txns.map((t) => (
            <div key={t.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  t.type === "credit" ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {t.type === "credit" ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.created_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className={`font-bold text-sm ${t.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                {t.type === "credit" ? "+" : "-"}{formatRupiah(t.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
      <WithdrawalDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} balance={balance} onDone={load} />
      <WithdrawalList />
    </Layout>
  );
}