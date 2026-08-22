import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

// True bila user ini adalah driver yang sudah diverifikasi (approved).
export function useIsDriver() {
  const { user } = useAuth();
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    base44.entities.DriverProfile.filter({ user_id: user.id })
      .then((list) => active && setIsDriver(list.some((p) => p.verification_status === "approved")))
      .catch(() => active && setIsDriver(false));
    return () => { active = false; };
  }, [user?.id]);

  return isDriver;
}