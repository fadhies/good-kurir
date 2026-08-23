import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function OrderChat({ order }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  async function load() {
    try {
      const list = await base44.entities.ChatMessage.filter({ order_id: order.id }, "created_date", 200);
      setMessages(list);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    load();
    const unsub = base44.entities.ChatMessage.subscribe(() => {
      load();
    });
    const poll = setInterval(load, 3000);
    return () => { unsub(); clearInterval(poll); };
  }, [order.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const participants = [order.created_by_id, order.driver_id].filter(Boolean);
      const senderRole = user?.role === "admin" ? "admin" : (order.created_by_id === user?.id ? "user" : "driver");
      await base44.entities.ChatMessage.create({
        order_id: order.id,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: senderRole,
        text: t,
        participants,
      });
      setText("");
      load();
    } catch (e) {
      toast({ title: "Gagal mengirim", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  // Hanya tampilkan jika driver sudah ditetapkan dan bukan dibatalkan
  if (!order.driver_id || order.status === "cancelled" || order.status === "pending_match") return null;

  const meIsDriver = order.driver_id === user?.id;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <Send className="w-4 h-4 text-primary" /> Chat {meIsDriver ? "dengan Pemesan" : "dengan Driver"}
      </h3>

      <div ref={scrollRef} className="h-56 overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-hide">
        {messages === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            Belum ada pesan. Sapa {meIsDriver ? "pemesan" : "driver"} Anda 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                  mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"
                }`}>
                  {!mine && (
                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                      {m.sender_role === "driver" ? "Driver" : m.sender_role === "admin" ? "Admin" : "Pemesan"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[9px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Tulis pesan..."
          className="flex-1 px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}