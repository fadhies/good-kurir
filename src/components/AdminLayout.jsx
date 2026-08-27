import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Bike, LayoutDashboard, Users, Bike as BikeIcon, ListOrdered, LogOut, ShieldCheck, Wallet, Home, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { exitApp } from "@/lib/exitApp";

const NAV = [
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { to: "/admin/driver", label: "Verifikasi Driver", icon: BikeIcon },
  { to: "/admin/users", label: "Pengguna", icon: Users },
  { to: "/admin/orders", label: "Pesanan", icon: ListOrdered },
  { to: "/admin/penarikan", label: "Penarikan", icon: Wallet },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleExit = async () => {
    const ok = await exitApp();
    if (!ok) alert("Tekan tombol Back pada ponsel untuk keluar dari aplikasi.");
  };

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-extrabold text-sm leading-tight">KurirTa</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" /> Kembali ke App
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" /> Keluar Akun
          </button>
          <button
            onClick={handleExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Power className="w-4 h-4" /> Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass-card border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-display font-extrabold">Admin Ojol Kita</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/")} className="p-2 text-muted-foreground" title="Kembali ke App">
              <Home className="w-5 h-5" />
            </button>
            <button onClick={handleExit} className="p-2 text-muted-foreground" title="Keluar Aplikasi">
              <Power className="w-5 h-5" />
            </button>
            <button onClick={logout} className="p-2 text-muted-foreground" title="Keluar Akun">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0">
        <main className="p-4 md:p-8 max-w-6xl mx-auto">{children}</main>
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-card border-t border-border">
          <div className="flex h-16">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
          </div>
        </nav>
      </div>
    </div>
  );
}