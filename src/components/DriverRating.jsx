import React, { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function DriverRating({ order, onRated }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (order.user_rating) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1">Rating Anda untuk driver</p>
        <div className="flex items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`w-6 h-6 ${n <= order.user_rating ? "text-amber-400 fill-current" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Terima kasih sudah memberi penilaian!</p>
      </div>
    );
  }

  async function submit() {
    if (!rating) {
      toast({ title: "Pilih bintang dulu", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("rateDriver", { orderId: order.id, rating });
      if (res.data?.success) {
        toast({ title: "Terima kasih atas penilaian Anda!" });
        onRated?.();
      } else {
        toast({ title: "Gagal memberi rating", description: res.data?.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Gagal memberi rating", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card rounded-2xl border-2 border-primary/30 p-5">
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-400 fill-current" /> Beri Rating Driver
      </h3>
      <p className="text-sm text-muted-foreground mb-3">Bagaimana pengalaman Anda dengan driver?</p>
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            disabled={submitting}
            className="p-1"
          >
            <Star
              className={`w-9 h-9 transition-colors ${(hover || rating) >= n ? "text-amber-400 fill-current" : "text-muted-foreground/30"}`}
            />
          </button>
        ))}
      </div>
      <button
        onClick={submit}
        disabled={submitting || !rating}
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
        Kirim Rating
      </button>
    </div>
  );
}