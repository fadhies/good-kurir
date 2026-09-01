import React from "react";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  pending_match: { label: "Mencari Driver", className: "bg-amber-100 text-amber-700" },
  driver_assigned: { label: "Driver Ditemukan", className: "bg-blue-100 text-blue-700" },
  at_store: { label: "Di Toko", className: "bg-indigo-100 text-indigo-700" },
  awaiting_payment: { label: "Menunggu Pembayaran", className: "bg-orange-100 text-orange-700" },
  paid: { label: "Dibayar", className: "bg-emerald-100 text-emerald-700" },
  on_the_way: { label: "Dalam Perjalanan", className: "bg-cyan-100 text-cyan-700" },
  completed: { label: "Selesai", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Dibatalkan", className: "bg-red-100 text-red-700" },
  driver_not_found: { label: "Driver Tidak Ditemukan", className: "bg-rose-100 text-rose-700" },
};

export default function OrderStatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}