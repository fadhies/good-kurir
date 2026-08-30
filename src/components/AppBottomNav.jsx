import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

// A deep route still "belongs" to a tab; clicking that tab routes back to the
// tab's root path instead of being a no-op.
function activeTabFor(pathname) {
  if (pathname.startsWith("/pesanan/")) return "/pesanan-saya";
  return TAB_PATHS.has(pathname) ? pathname : null;
}

// Rendered at the App level (outside the animated page wrapper) so it stays
// viewport-fixed and flush to the phone's nav bar, and doesn't drift during
// the directional slide transitions.
export default function AppBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDriver = useIsDriver();
  const role = user?.role || "user";

  const activeTab = activeTabFor(location.pathname);
  if (!activeTab) return null;

  const items = [
    ...USER_ITEMS,
    ...(isDriver ? DRIVER_ITEMS : []),
    ...(role === "admin" ? ADMIN_ITEMS : []),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-card border-t border-border/60"
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = activeTab === item.to;
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to, { replace: activeTab === item.to && location.pathname !== item.to })}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}