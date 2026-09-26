import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useIsDriver } from "@/hooks/useIsDriver";
import { Home, MessageCircle, ListOrdered, Wallet, UserCircle, LayoutDashboard, ShieldCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileMenu from "@/components/ProfileMenu";
import NotificationBell from "@/components/NotificationBell";
import { Image } from "@/components/ui/image";
const USER_ITEMS = [
{ to: "/", label: "Beranda", icon: Home },
{ to: "/chat", label: "Chat", icon: MessageCircle },
{ to: "/pesanan-saya", label: "Pesanan", icon: ListOrdered }];

const DRIVER_ITEMS = [
{ to: "/driver", label: "Dashboard", icon: LayoutDashboard },
{ to: "/driver/dompet", label: "Dompet", icon: Wallet }];

const ADMIN_ITEMS = [
{ to: "/admin", label: "Admin", icon: ShieldCheck }];


export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || "user";
  const isDriver = useIsDriver();

  const items = [...USER_ITEMS, ...(isDriver ? DRIVER_ITEMS : []), ...(role === "admin" ? ADMIN_ITEMS : [])];

  const tabPaths = items.map((i) => i.to);
  const isDetail = !tabPaths.includes(location.pathname);
  const pageTitle = /^\/pesanan\//.test(location.pathname) ?
  "Detail Pesanan" :
  location.pathname === "/jadi-driver" ?
  "Daftar Driver" :
  "OjekTa";

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-primary/30 ring-2 ring-primary/20">
              <Image
                src="https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/622adcb21_LogoAplikasi.png"
                alt="OjekTa"
                className="w-full h-full" />
              
              


              
              
            </div>
            <span className="tracking-tight font-medium text-xl [font-family:'Poppins',_sans-serif]">
              Ojek<span className="text-primary">Ta</span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active ?
                  "bg-primary text-primary-foreground" :
                  "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>);

          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          {isDetail &&
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <UserCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground truncate flex-1">
              {user?.full_name || user?.email}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold capitalize shrink-0">
              {role === "driver" ? "Driver" : role === "admin" ? "Admin" : "User"}
            </span>
          </div>
          <div className="flex items-center gap-1 px-1">
            <NotificationBell />
            <ProfileMenu />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile only) */}
        <header className="md:hidden sticky top-0 z-40 glass-card border-b border-border/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="px-4 h-16 flex items-center justify-between">
            {isDetail ?
            <div className="flex items-center gap-1">
                <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors"
                title="Kembali">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-bold tracking-tight [font-family:'Archivo',_sans-serif] text-base">{pageTitle}</span>
              </div> :
            <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-md shadow-primary/30 ring-2 ring-primary/20">
                  <Image
                  src="https://media.base44.com/images/public/6a88f0c161e7b497808d40e0/622adcb21_LogoAplikasi.png"
                  alt="OjekTa"
                  className="w-full h-full" />
                
                </div>
                <span className="tracking-tight [font-family:'Alegreya',_serif] font-medium text-2xl">
                  Ojek<span className="text-primary">Ta</span>
                </span>
              </Link>
            }
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={cn("flex-1 w-full mx-auto px-4 py-6 max-w-4xl", isDetail ? "pb-10" : "pb-28 md:pb-10")}>
          {children}
        </main>
      </div>
    </div>);

}