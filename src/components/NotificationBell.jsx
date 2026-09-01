import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import S from "@/lib/supabaseEntities";
import { Bell, Bike, CheckCircle2, MessageCircle, ShoppingBag, Package } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBackHandler } from "@/hooks/useBackHandler";
import { cn } from "@/lib/utils";
import moment from "moment";

const TYPE_META = {
  new_order: { icon: ShoppingBag, tint: "text-amber-600 bg-amber-100" },
  order_accepted: { icon: Bike, tint: "text-blue-600 bg-blue-100" },
  order_completed: { icon: CheckCircle2, tint: "text-green-600 bg-green-100" },
  new_message: { icon: MessageCircle, tint: "text-primary bg-primary/10" },
  order_cancelled: { icon: Package, tint: "text-red-600 bg-red-100" },
  payment_received: { icon: CheckCircle2, tint: "text-green-600 bg-green-100" },
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await S.Notification.filter(
        { user_id: user.id },
        "-created_date",
        20
      );
      setItems(rows);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    let unsub = () => {};
    try {
      unsub = S.Notification.subscribe(() => load());
    } catch {}
    return () => {
      clearInterval(poll);
      unsub();
    };
  }, [user?.id]);

  const unread = items.filter((i) => !i.is_read).length;

  async function markAllRead() {
    if (!unread) return;
    try {
      await S.Notification.updateMany(
        { user_id: user.id, is_read: false },
        { $set: { is_read: true } }
      );
      load();
    } catch {}
  }

  function handleOpenChange(v) {
    setOpen(v);
    if (v) markAllRead();
  }

  function handleClick(item) {
    setOpen(false);
    if (item.type === "new_order") {
      navigate("/driver");
      return;
    }
    if (item.order_id) navigate(`/pesanan/${item.order_id}`);
  }

  // Native back button closes the open panel instead of navigating away.
  useBackHandler(() => setOpen(false), open);

  const trigger = (
    <button
      className="relative p-2 rounded-full hover:bg-secondary text-foreground transition-colors"
      title="Notifikasi"
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );

  const panel = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-bold text-sm">Notifikasi</span>
        {unread > 0 && (
          <span className="text-xs text-muted-foreground">{unread} baru</span>
        )}
      </div>
      <div className="overflow-y-auto flex-1 max-h-[60vh]">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Belum ada notifikasi
          </div>
        ) : (
          items.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.new_message;
            const Icon = meta.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 border-b border-border/60 text-left hover:bg-secondary/60 transition-colors",
                  !item.is_read && "bg-primary/5"
                )}
              >
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", meta.tint)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{item.title}</p>
                  {item.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {moment(item.created_date).fromNow()}
                  </p>
                </div>
                {!item.is_read && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[75vh]">{panel}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 max-h-[70vh] flex flex-col">
        {panel}
      </PopoverContent>
    </Popover>
  );
}