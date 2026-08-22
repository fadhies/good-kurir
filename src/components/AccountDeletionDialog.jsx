import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2, ShieldAlert } from "lucide-react";

const OPTIONS = [
  { key: "orders", label: "Riwayat pesanan saya" },
  { key: "driver", label: "Profil driver saya" },
  { key: "wallet", label: "Riwayat dompet saya" },
];

export default function AccountDeletionDialog() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState({ orders: true, driver: true, wallet: true });
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    const cats = OPTIONS.filter((o) => picked[o.key]).map((o) => o.key);
    if (cats.length === 0) {
      toast({ title: "Pilih data yang ingin dihapus", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke("deleteAccount", { categories: cats });
      toast({
        title: "Data berhasil dihapus",
        description: "Akun dan data terkait telah dipurnakan. Anda akan keluar.",
      });
      setOpen(false);
      logout();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Hapus Akun"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Hapus Akun & Data
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini permanen. Pilih data yang ingin Anda purnakan. Anda akan keluar otomatis setelah penghapusan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {OPTIONS.map((o) => (
            <label key={o.key} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={picked[o.key]}
                onCheckedChange={(v) => setPicked((p) => ({ ...p, [o.key]: !!v }))}
              />
              <Label className="text-sm font-medium cursor-pointer">{o.label}</Label>
            </label>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Hapus Permanen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}