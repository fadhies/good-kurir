import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import S from "@/lib/supabaseEntities";
import { base44 } from "@/api/base44Client";
import { subscribeAdminChat } from "@/lib/realtime";
import { Loader2, Send, Clock, LifeBuoy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Chat langsung admin-driver, di luar pesanan. Thread per driver:
// admin membukanya dari detail driver, driver dari menu Bantuan.
export default function AdminDriverChat({ driverId, driverName, viewerRole, className }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(null); // optimistic message
  const scrollRef = useRef(null);

  async function load() {
    try {
      const list = await S.AdminChatMessage.filter({ driver_id: driverId }, "created_date", 200);
      setMessages(list);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    load();
    // Realtime: trigger database mengirim sinyal ke topik admin_chat:<driver_id>.
    const unsubP = subscribeAdminChat(driverId, () => load());
    // Jaring pengaman bila sinyal realtime belum aktif di database.
    const poll = setInterval(load, 30000);
    return () => {
      clearInterval(poll);
      Promise.resolve(unsubP).then((u) => u && u());
    };
  }, [driverId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pending]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    setText("");
    const optimistic = {
      id: `opt_${Date.now()}`,
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      sender_role: viewerRole,
      text: t,
      created_date: new Date().toISOString(),
      _pending: true,
    };
    setPending(optimistic);
    setSending(true);
    try {
      await S.AdminChatMessage.create({
        driver_id: driverId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: viewerRole,
        text: t,
      });
      // Notifikasi lonceng + push ke penerima (best-effort).
      base44.functions
        .invoke("notifyAdminChat", { driverId, text: t })
        .catch(() => {});
      await load();
      setPending(null);
    } catch (e) {
      setPending(null);
      setText(t);
      toast({ title: "Gagal mengirim", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const meIsAdmin = viewerRole === "admin";
  const confirmed = messages || [];
  const showPending = pending && !confirmed.some((m) => m.sender_id === pending.sender_id && m.text === pending.text);
  const display = showPending ? [...confirmed, pending] : confirmed;

  return (
    <div className={cn("bg-card rounded-2xl border border-border p-4 flex flex-col min-h-0", className)}>
      <h3 className="font-bold mb-3 flex items-center gap-2 shrink-0">
        <LifeBuoy className="w-4 h-4 text-primary" />
        {meIsAdmin ? `Chat dengan ${driverName || "Driver"}` : "Chat dengan Admin"}
      </h3>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-hide">
        {messages === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : display.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            Belum ada pesan. {meIsAdmin ? "Sapa driver 👋" : "Tanyakan apa saja ke admin 👋"}
          </p>
        ) : (
          display.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                  mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"
                } ${m._pending ? "opacity-60" : ""}`}>
                  {!mine && (
                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                      {m.sender_role === "admin" ? "Admin" : "Driver"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words selectable">{m.text}</p>
                  {m._pending ? (
                    <p className="text-[9px] mt-0.5 flex items-center gap-1 text-primary-foreground/70">
                      <Clock className="w-3 h-3" /> Mengirim...
                    </p>
                  ) : (
                    <p className={`text-[9px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
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