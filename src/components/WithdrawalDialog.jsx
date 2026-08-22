import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/lib/geo";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MIN_REMAINING = 10000;

export default function WithdrawalDialog({ open, onOpenChange, balance, onDone }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [loading, setLoading] = useState(false);

  const maxAmount = Math.max(0, balance - MIN_REMAINING);

  function reset() {
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setHolderName("");
  }

  async function submit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Nominal tidak valid", variant: "destructive" });
      return;
    }
    if (balance - amt < MIN_REMAINING) {
      toast({ title: `Sisakan minimal Rp${MIN_REMAINING.toLocaleString("id-ID")}`, variant: "destructive" });
      return;
    }
    if (!bankName || !accountNumber) {
      toast({ title: "Bank & nomor rekening wajib diisi", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("requestWithdrawal", {
        amount: amt,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder_name: holderName,
      });
      if (res.data?.success) {
        toast({ title: "Permintaan penarikan dikirim", description: "Admin akan memproses penarikan Anda." });
        reset();
        onOpenChange(false);
        onDone?.();
      } else {
        toast({ title: "Gagal", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tarik Saldo</DialogTitle>
          <DialogDescription>
            Saldo tersedia {formatRupiah(balance)}. Maks. tarik {formatRupiah(maxAmount)} (sisakan Rp10.000).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Nominal Penarikan (Rp)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
          </div>
          <div>
            <Label>Nama Bank</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA / Mandiri / BRI" />
          </div>
          <div>
            <Label>Nomor Rekening</Label>
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567890" />
          </div>
          <div>
            <Label>Nama Pemilik Rekening (opsional)</Label>
            <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Nama sesuai rekening" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Batal</Button>
          <Button onClick={submit} disabled={loading || maxAmount <= 0}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim Permintaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}