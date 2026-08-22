import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useIsDriver } from "@/hooks/useIsDriver";
import { Bike, Home, ShoppingBag, ListOrdered, Wallet, UserCircle, LogOut, LayoutDashboard, ShieldCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import AccountDeletionDialog from "@/components/AccountDeletionDialog";

const USER_ITEMS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/pesan", label: "Pesan", icon: ShoppingBag },
  { to: "/pesanan-saya", label: "Pesanan", icon: ListOrdered },
];
const DRIVER_ITEMS = [
  { to: "/driver", label: "Dashboard", icon: LayoutDashboard },
  { to: "/driver/dompet", label: "Dompet", icon: Wallet },
];
const ADMIN_ITEMS = [
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || "user";
  const isDriver = useIsDriver();

  const items = [...USER_ITEMS, ...(isDriver ? DRIVER_ITEMS : []), ...(role === "admin" ? ADMIN_ITEMS : [])];

  const tabPaths = items.map((i) => i.to);
  const isDetail = !tabPaths.includes(location.pathname);
  const pageTitle = /^\/pesanan\//.test(location.pathname)
    ? "Detail Pesanan"
    : location.pathname === "/jadi-driver"
    ? "Daftar Driver"
    : "KurirTa";

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {isDetail ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-display font-bold text-lg tracking-tight">{pageTitle}</span>
            </div>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                <Bike className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-extrabold text-lg tracking-tight">
                Kurir<span className="text-primary">Ta</span>
              </span>
            </Link>
          )}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
              <UserCircle className="w-4 h-4 text-secondary-foreground" />
              <span className="text-sm font-medium text-secondary-foreground">
                {user?.full_name || user?.email}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold capitalize">
                {role === "driver" ? "Driver" : role === "admin" ? "Admin" : "User"}
              </span>
            </div>
            <AccountDeletionDialog />
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={cn("flex-1 max-w-6xl w-full mx-auto px-4 py-6", isDetail ? "pb-10" : "pb-28 md:pb-10")}>
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      {!isDetail && (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-card border-t border-border/60" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
      )}

      {/* Side nav (desktop) - rendered as floating rail */}
      <nav className="hidden md:flex fixed left-1/2 -translate-x-[19rem] top-1/2 -translate-y-1/2 flex-col gap-1">
        {items.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}