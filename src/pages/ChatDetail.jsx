import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import OrderChat from "@/components/OrderChat";
import S from "@/lib/supabaseEntities";
import { Loader2, MessageCircle } from "lucide-react";

// Halaman percakapan saja untuk satu pesanan — tanpa membuka keseluruhan
// halaman pelacakan pesanan.
export default function ChatDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined);

  useEffect(() => {
    let active = true;
    if (!id) return;
    S.Order.get(id)
      .then((o) => {
        if (active) setOrder(o);
      })
      .catch(() => {
        if (active) setOrder(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (order === undefined) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const chatReady =
    order && order.driver_id && order.status !== "cancelled" && order.status !== "pending_match";

  return (
    <Layout>
      <h1 className="text-base font-extrabold text-foreground tracking-tight leading-tight">
        Chat Pesanan #{String(id).slice(0, 8)}
      </h1>
      <p className="text-[11px] text-muted-foreground font-medium mb-4">
        Percakapan driver/pemesan untuk pesanan ini
      </p>

      {chatReady ? (
        <OrderChat order={order} />
      ) : (
        <div className="text-center py-16 px-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <MessageCircle className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-foreground mt-3">Chat belum tersedia</p>
          <p className="text-xs text-muted-foreground mt-1">
            Chat dapat digunakan setelah pesanan diterima driver.
          </p>
        </div>
      )}
    </Layout>
  );
}