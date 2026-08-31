import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import S from "@/lib/supabaseEntities";
import { formatRupiah } from "@/lib/geo";
import { Loader2 } from "lucide-react";

const STATUS = {
  pending: { label: "Diproses Admin", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700" }
};

export default function WithdrawalList() {
  const { user } = useAuth();
  const [list, setList] = useState(null);

  async function load() {
    try {
      const r = await S.WithdrawalRequest.filter({ user_id: user.id }, "-created_date", 20);
      setList(r);
    } catch {
      setList([]);
    }
  }

  useEffect(() => {
    load();
    const unsub = S.WithdrawalRequest.subscribe(() => load());
    return unsub;
  }, []);

  if (list === null) {
    return <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (list.length === 0) return null;

  return (
    <div className="mt-6">
      
      <div className="space-y-2">
        {list.map((w) => {
          const s = STATUS[w.status] || STATUS.pending;
          return null;















        })}
      </div>
    </div>);

}