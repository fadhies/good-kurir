import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useIsDriver } from "@/hooks/useIsDriver";
import { Home, ShoppingBag, ListOrdered, LayoutDashboard, Wallet, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const USER_ITEMS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/pesan", label: "Pesan", icon: ShoppingBag },
  { to: "/pesanan-saya", label: "Pesanan", icon: ListOrdered },
];
const DRIVER_ITEMS = [
  { to: "/driver", label: "Dashboard", icon: LayoutDashboard },
  { to: "/driver/dompet", label: "Dompet", icon: Wallet },
];
const ADMIN_ITEMS = [{ to: "/admin", label: "Admin", icon: ShieldCheck }];

const TAB_PATHS = new Set(["/", "/pesan", "/pesanan-saya", "/driver", "/driver/dompet"]);

// Rendered at the App level (outside the animated page wrapper) so it stays
// viewport-fixed and flush to the phone's nav bar, and doesn't drift during
// the directional slide transitions.
export default function AppBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const isDriver = useIsDriver();
  const role = user?.role || "user";

  if (!TAB_PATHS.has(location.pathname)) return null;

  const items = [
    ...USER_ITEMS,
    ...(isDriver ? DRIVER_ITEMS : []),
    ...(role === "admin" ? ADMIN_ITEMS : []),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-card border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}