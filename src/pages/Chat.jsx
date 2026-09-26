import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import PullToRefresh from "@/components/PullToRefresh";
import S from "@/lib/supabaseEntities";
import { Loader2, MessageCircle, ChevronRight } from "lucide-react";

function timeLabel(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Daftar percakapan user/driver: pesan chat dikelompokkan per pesanan,
// menampilkan pesan terakhir. Klik membuka detail pesanan (chat ada di sana).
export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);

  async function load() {
    try {
      const msgs = await S.ChatMessage.filter({ participants: user.id }, "-created_date", 500);
      const map = new Map();
      for (const m of msgs) {
        if (m.order_id && !map.has(m.order_id)) map.set(m.order_id, m);
      }
      setConversations(Array.from(map.values()));
    } catch {
      setConversations([]);
    }
  }

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  return (
    <Layout>
      <PullToRefresh onRefresh={load}>
        <h1 className="text-base font-extrabold text-foreground tracking-tight leading-tight">Chat</h1>
        <p className="text-[11px] text-muted-foreground font-medium mb-4">
          Percakapan dengan driver/pemesan pada pesanan Anda
        </p>

        {conversations === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <MessageCircle className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-foreground mt-3">Belum ada percakapan</p>
            <p className="text-xs text-muted-foreground mt-1">
              Chat otomatis tersedia setelah pesanan Anda diterima driver.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {conversations.map((m) => (
              <button
                key={m.order_id}
                onClick={() => navigate(`/pesanan/${m.order_id}`)}
                className="w-full text-left bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground truncate">
                      Pesanan #{String(m.order_id).slice(0, 8)}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeLabel(m.created_date)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {m.sender_id === user.id
                      ? "Anda"
                      : m.sender_role === "driver"
                        ? "Driver"
                        : m.sender_role === "admin"
                          ? "Admin"
                          : "Pemesan"}
                    : {m.text}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </PullToRefresh>
    </Layout>
  );
}