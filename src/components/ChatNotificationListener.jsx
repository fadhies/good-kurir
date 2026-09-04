import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import S from "@/lib/supabaseEntities";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function ChatNotificationListener() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const lastSeenDate = useRef(null);
  const currentOrderIdRef = useRef(null);
  const notifiedRef = useRef(new Set());

  // Track order tracking page currently open
  useEffect(() => {
    const m = location.pathname.match(/^\/pesanan\/(.+)$/);
    currentOrderIdRef.current = m ? m[1] : null;
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    async function check() {
      try {
        const rows = await S.ChatMessage.filter(
          { participants: user.id },
          "-created_date",
          5
        );
        if (!active || !rows.length) {
          if (!active) return;
          return;
        }
        const latestDate = rows[0].created_date;
        if (!lastSeenDate.current) {
          lastSeenDate.current = latestDate;
          return;
        }
        const newOnes = rows.filter(
          (m) =>
            m.sender_id !== user.id &&
            m.created_date > lastSeenDate.current &&
            !notifiedRef.current.has(m.id)
        );
        if (!newOnes.length) return;
        // Notify each new message not currently being viewed
        newOnes.forEach((m) => {
          notifiedRef.current.add(m.id);
          if (currentOrderIdRef.current === m.order_id) return;
          const senderLabel =
            m.sender_role === "driver"
              ? "Driver"
              : m.sender_role === "admin"
              ? "Admin"
              : "Pelanggan";
          const preview =
            m.text && m.text.length > 60 ? m.text.slice(0, 60) + "…" : m.text;
          toast({
            title: `💬 Pesan dari ${senderLabel}`,
            description: preview || "Pesan baru",
            duration: 6000,
            action: (
              <ToastAction
                altText="Lihat pesan"
                onClick={() => navigate(`/pesanan/${m.order_id}`)}
              >
                Lihat
              </ToastAction>
            ),
          });
          if (navigator.vibrate) navigator.vibrate(100);
          // Notifikasi lonceng & push tray HP dibuat oleh backend
          // (notifyChatMessage) — jangan duplikat di sini.
        });
        lastSeenDate.current = latestDate;
      } catch (e) {
        // ignore polling errors
      }
    }

    // Set baseline so we don't notify on old messages at mount
    S.ChatMessage
      .filter({ participants: user.id }, "-created_date", 1)
      .then((rows) => {
        if (active && rows.length) lastSeenDate.current = rows[0].created_date;
      })
      .catch(() => {});

    const poll = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [user?.id]);

  return null;
}