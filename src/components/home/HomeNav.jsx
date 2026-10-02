import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useIsDriver } from "@/hooks/useIsDriver";
import { Home, MessageCircle, ListOrdered, Wallet, LayoutDashboard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Beranda", icon: Home, always: true },
  { to: "/chat", label: "Chat", icon: MessageCircle, always: true },
  { to: "/pesanan-saya", label: "Pesanan", icon: ListOrdered, always: true },
  { to: "/driver", label: "Dashboard", icon: LayoutDashboard, always: false },
  { to: "/driver/dompet", label: "Dompet", icon: Wallet, always: false },
  { to: "/admin", label: "Admin", icon: ShieldCheck, always: false, admin: true },
];

// Menu navigasi untuk beranda versi tablet/desktop (landscape).
export default function HomeNav() {
  const { user } = useAuth();
  const isDriver = useIsDriver();
  const role = user?.role || "user";
  const location = useLocation();

  const items = ITEMS.filter(
    (i) => i.always || (i.admin ? role === "admin" : isDriver)
  );

  return (
    <nav className="flex items-center gap-2 flex-wrap">
      {items.map((item) => {
        const active = location.pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
              active
                ? "bg-primary text-white"
                : "text-[#667085] hover:bg-[#f1faf5] hover:text-[#07935b]"
            )}>
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}