import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

// True bila user ini berperan sebagai driver:
// role "driver"/"admin", atau memiliki DriverProfile (terdaftar jadi driver).
export function useIsDriver() {
  const { user } = useAuth();
  const role = user?.role || "user";
  const [isDriver, setIsDriver] = useState(role === "driver" || role === "admin");

  useEffect(() => {
    if (role === "driver" || role === "admin") {
      setIsDriver(true);
      return;
    }
    let active = true;
    base44.entities.DriverProfile.filter({ user_id: user.id })
      .then((list) => active && setIsDriver(list.length > 0))
      .catch(() => active && setIsDriver(false));
    return () => { active = false; };
  }, [user?.id, role]);

  return isDriver;
}