import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useIsDriver } from "@/hooks/useIsDriver";
import { Home, ShoppingBag, ListOrdered, LayoutDashboard, Wallet, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const USER_ITEMS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/pesan", label: "Pesan", icon: ShoppingBag },
  { to: "/pesanan-saya", label: "Pesanan", icon: ListOrdered }
];

const DRIVER_ITEMS = [
  { to: "/driver", label: "Dashboard", icon: LayoutDashboard },
  { to: "/driver/dompet", label: "Dompet", icon: Wallet }
];

const ADMIN_ITEMS = [
  { to: "/admin", label: "Admin", icon: ShieldCheck }
];

// Map nested detail routes to their parent tab for active highlighting.
function activeTabFor(pathname) {
  if (pathname.startsWith("/pesanan/")) return "/pesanan-saya";
  if (pathname.startsWith("/driver/dompet")) return "/driver/dompet";
  if (pathname.startsWith("/driver")) return "/driver";
  if (pathname.startsWith("/admin")) return "/admin";
  return pathname;
}

export default function AppBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDriver = useIsDriver();
  const role = user?.role || "user";

  const items = [
    ...USER_ITEMS,
    ...(isDriver ? DRIVER_ITEMS : []),
    ...(role === "admin" ? ADMIN_ITEMS : [])
  ];

  const activeTab = activeTabFor(location.pathname);

  // Admin pages use their own AdminLayout navigation; don't render the user
  // bottom nav there or it covers the admin sub-menu (Ringkasan/Tarif/Setoran).
  if (location.pathname.startsWith("/admin")) return null;

  function handleTap(item) {
    // Force redirect to the tab root when tapping the current tab — even from
    // a nested detail route — so users always land on the root of that tab.
    if (activeTab === item.to && location.pathname !== item.to) {
      navigate(item.to, { replace: true });
    } else if (location.pathname === item.to) {
      navigate(item.to);
    } else {
      navigate(item.to);
    }
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-card border-t border-border/60"
    >
      <div
        className="max-w-6xl mx-auto grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = activeTab === item.to;
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              onClick={() => handleTap(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
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