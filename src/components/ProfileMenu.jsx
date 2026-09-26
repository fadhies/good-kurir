import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import S from "@/lib/supabaseEntities";
import { Image } from "@/components/ui/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Trash2 } from "lucide-react";
import AccountDeletionDialog from "@/components/AccountDeletionDialog";

// Foto profil di pojok kanan atas: driver memakai foto selfie saat daftar,
// user memakai foto profil Google. Klik membuka menu Keluar Akun / Hapus Akun.
export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [driverPhoto, setDriverPhoto] = useState(null);
  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    S.DriverProfile.filter({ user_id: user.id })
      .then((list) => {
        if (active) setDriverPhoto(list[0]?.selfie_with_ktp || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);

  const photo = driverPhoto || user?.photo_url || user?.image_url || null;
  const initial = (user?.full_name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-0.5 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
            title="Akun"
          >
            {photo ? (
              <span className="block w-9 h-9 rounded-full overflow-hidden bg-muted">
                <Image src={photo} alt={user?.full_name || "Foto profil"} className="w-full h-full" />
              </span>
            ) : (
              <span className="block w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {initial}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-medium truncate">
            {user?.full_name || user?.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="w-4 h-4" /> Keluar Akun
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDelOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4" /> Hapus Akun
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AccountDeletionDialog open={delOpen} onOpenChange={setDelOpen} />
    </>
  );
}