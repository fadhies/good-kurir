import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import { formatRupiah } from "@/lib/geo";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Copy, Share2, Loader2, Ticket, UserPlus, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Referral() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  async function load() {
    try {
      const res = await base44.functions.invoke("getReferral", {});
      setData(res.data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const link = data?.code ? `https://ojekta.com/?ref=${data.code}` : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Tautan disalin" });
    } catch {
      toast({ title: "Gagal menyalin tautan", variant: "destructive" });
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "OjekTa",
          text: "Yuk pakai OjekTa! Daftar lewat tautan ini:",
          url: link,
        });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    // navigator.share tidak tersedia (mis. WebView Android) -> tampilkan dialog.
    setShareOpen(true);
  }

  const referrals = data?.referrals || [];
  const coupons = data?.coupons || [];
  const availableCoupons = coupons.filter((c) => c.status === "unused");
  const usedCoupons = coupons.filter((c) => c.status === "used");

  const btnCls =
    "py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95";
  const detailCardCls = "bg-card p-4 rounded-3xl border border-border shadow-sm";

  return (
    <Layout>
      <h1 className="text-base text-foreground tracking-tight leading-tight [font-family:'Poppins',_sans-serif] font-semibold">
        Referal & Kupon
      </h1>
      <p className="text-[11px] text-muted-foreground font-medium mb-4">
        Bagikan tautanmu. Saat temanmu menyelesaikan order pertamanya, kamu
        mendapat kupon potongan ongkir {formatRupiah(2000)}.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tautan referal */}
          <div className={detailCardCls}>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">Tautan Referal Kamu</h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 break-all selectable">
              {link}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-2 mb-3">
              Minta temanmu membuka tautan ini, lalu mengunduh aplikasi lewat
              tombol Play Store di halaman utamanya agar kode referalmu ikut
              terbawa. Mendaftar di web saja tidak menghubungkan kode ke akun
              aplikasinya secara otomatis.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyLink}
                className={`${btnCls} border border-slate-200 bg-background text-foreground hover:border-slate-300`}
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? "Tersalin!" : "Salin"}
              </button>
              <button
                onClick={share}
                className={`${btnCls} bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700`}
              >
                <Share2 className="w-3.5 h-3.5" /> Bagikan
              </button>
            </div>
          </div>

          {/* Statistik referal */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`${detailCardCls} !p-3 text-center`}>
              <UserPlus className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-extrabold leading-tight">{referrals.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Ajakan</p>
            </div>
            <div className={`${detailCardCls} !p-3 text-center`}>
              <BadgeCheck className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold leading-tight">
                {referrals.filter((r) => r.status === "rewarded").length}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">Berhasil</p>
            </div>
            <div className={`${detailCardCls} !p-3 text-center`}>
              <Ticket className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold leading-tight">{availableCoupons.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Kupon</p>
            </div>
          </div>

          {/* Daftar kupon */}
          <div className={detailCardCls}>
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">Kupon Saya</h3>
            </div>
            {coupons.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Belum ada kupon. Ajak temanmu lewat tautan referal untuk mendapatkannya.
              </p>
            ) : (
              <div className="space-y-2">
                {coupons.map((c) => {
                  const used = c.status === "used";
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border ${
                        used ? "border-slate-200 bg-slate-50 opacity-60" : "border-emerald-200 bg-emerald-50/60"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
                          used ? "bg-slate-200 text-slate-500" : "bg-emerald-600 text-white"
                        }`}
                      >
                        <Ticket className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">
                          Potongan Ongkir {formatRupiah(c.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {used ? "Sudah dipakai" : "Tersedia, otomatis dipakai saat memesan"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                          used ? "bg-slate-200 text-slate-500" : "bg-emerald-600 text-white"
                        }`}
                      >
                        {used ? "Terpakai" : "Tersedia"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="h-4" />

      {/* Dialog bagikan (fallback bila Web Share API tidak tersedia) */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-xs rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Bagikan Tautan Referal</DialogTitle>
          </DialogHeader>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 break-all selectable">
            {link}
          </div>
          <button
            onClick={copyLink}
            className={`${btnCls} bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700`}
          >
            <Copy className="w-3.5 h-3.5" /> {copied ? "Tersalin!" : "Salin Tautan"}
          </button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}