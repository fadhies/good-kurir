import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, Users, Bike as BikeIcon, ListOrdered, ShieldCheck, Home, Tag, Banknote, Lock, Megaphone, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileMenu from "@/components/ProfileMenu";

const NAV = [
{ to: "/admin", label: "Ringkasan", icon: LayoutDashboard },
{ to: "/admin/driver", label: "Verifikasi Driver", icon: BikeIcon },
{ to: "/admin/users", label: "Pengguna", icon: Users },
{ to: "/admin/orders", label: "Pesanan", icon: ListOrdered },
{ to: "/admin/tarif", label: "Tarif", icon: Tag },
{ to: "/admin/setoran", label: "Setoran", icon: Banknote },
{ to: "/admin/privacy", label: "Privasi", icon: Lock },
{ to: "/admin/broadcast", label: "Broadcast", icon: Megaphone }];


export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup menu saat pindah halaman.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] bg-background flex [font-family:'Poppins',_sans-serif]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="leading-tight text-lg font-semibold [font-family:'Poppins',_sans-serif]">OjekTa</p>
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
                )}>
                
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>);

          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            
            <Home className="w-4 h-4" /> Kembali ke App
          </button>
          <div className="flex items-center gap-2 px-2 py-1">
            <ProfileMenu />
            <span className="text-xs text-muted-foreground truncate">{user?.full_name || user?.email}</span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass-card border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-14 flex items-center justify-between px-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2.5 rounded-xl text-foreground hover:bg-secondary active:scale-95 transition"
              title="Buka menu"
              aria-label="Buka menu admin">
              <Menu className="w-5 h-5" />
            </button>
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xl [font-family:'Poppins',_sans-serif] font-semibold">Admin OjekTa</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/")} className="p-2 text-muted-foreground" title="Kembali ke App">
              <Home className="w-5 h-5" />
            </button>
            <ProfileMenu />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0">
        <main className="p-4 pb-10 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>

      {/* Menu hamburger (HP) */}
      {menuOpen &&
      <>
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMenuOpen(false)} />

        <div className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-card shadow-2xl flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="leading-tight text-lg font-semibold [font-family:'Poppins',_sans-serif]">OjekTa</p>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary"
              aria-label="Tutup menu">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}>
                  
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>);

            })}
          </nav>
          <div className="p-3 border-t border-border shrink-0">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              
              <Home className="w-4 h-4" /> Kembali ke App
            </button>
            <div className="flex items-center gap-2 px-2 py-1">
              <ProfileMenu />
              <span className="text-xs text-muted-foreground truncate">{user?.full_name || user?.email}</span>
            </div>
          </div>
        </div>
      </>
      }
    </div>);

}