import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import { Megaphone, Loader2, Send, CheckCircle2, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const TITLE_MAX = 100;
const CONTENT_MAX = 500;

export default function AdminBroadcast() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  async function send() {
    setSending(true);
    setConfirmOpen(false);
    try {
      const res = await base44.functions.invoke("broadcastPush", { title, content });
      if (res.data?.ok) {
        setResult(res.data);
        toast({ title: "Broadcast terkirim" });
      } else {
        toast({ title: "Gagal", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal mengirim", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const valid = title.trim() && content.trim();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-lg font-medium flex items-center gap-2 [font-family:'Poppins',_sans-serif]">
          <Megaphone className="w-6 h-6 text-primary" /> Broadcast Push
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kirim pengumuman sebagai notifikasi push ke ponsel semua pengguna aplikasi.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 max-w-xl space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-1.5">Judul</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Contoh: Promo Hari Ini"
            className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-[10px] text-muted-foreground mt-1">{title.length}/{TITLE_MAX}</p>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">Isi Pesan</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={CONTENT_MAX}
            rows={5}
            placeholder="Tulis isi pengumuman..."
            className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1">{content.length}/{CONTENT_MAX}</p>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!valid || sending}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {sending ? "Mengirim..." : "Kirim ke Semua Pengguna"}
        </button>

        {sending && (
          <p className="text-xs text-muted-foreground text-center">
            Mengirim notifikasi push ke semua pengguna, mohon tunggu...
          </p>
        )}

        {result && (
          <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-1.5">
            <p className="text-sm font-bold">Hasil Pengiriman</p>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{result.sent} terkirim</span>
            </div>
            {result.failed > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="w-4 h-4" />
                <span>{result.failed} gagal</span>
              </div>
            )}
            {result.failures?.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-semibold text-destructive cursor-pointer select-none">
                  Lihat rincian gagal ({result.failures.length})
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-hide">
                  {result.failures.map((f, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground break-words">
                      <span className="font-medium">{f.email || f.user_id}</span>: {f.reason}
                    </p>
                  ))}
                </div>
              </details>
            )}
            <p className="text-[10px] text-muted-foreground">
              Notifikasi hanya sampai pada pengguna yang menginstal aplikasi native.
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim ke semua pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesan "{title.trim()}" akan dikirim sebagai notifikasi push ke seluruh pengguna aplikasi. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={send} disabled={sending}>
              {sending ? "Memproses..." : "Ya, Kirim"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}