import { base44 } from "@/api/base44Client";

export const DEFAULT_TARIFFS = {
  food: {
    hemat: { base: 7000, base_km: 4, per_km: 1000 },
    cepat: { base: 12000, base_km: 4, per_km: 2000 },
  },
  goods: { base: 12000, base_km: 4, per_km: 2000 },
  person: { base: 12000, base_km: 4, per_km: 2000 },
  service_fee_percent: 10,
  driver_remit_per_txn: 1000,
};

export async function getTariffs() {
  try {
    const rows = await base44.entities.AppSetting.filter({ key: "tariffs" }, "-created_date", 1);
    if (rows[0]?.value) return { ...DEFAULT_TARIFFS, ...JSON.parse(rows[0].value) };
  } catch {}
  return DEFAULT_TARIFFS;
}

export function computeDeliveryFee(tariffs, distanceKm, mode = "hemat", type = "food") {
  let t;
  if (type === "goods") t = tariffs.goods;
  else if (type === "person") t = tariffs.person;
  else t = mode === "cepat" ? tariffs.food?.cepat : tariffs.food?.hemat;
  if (!t) t = { base: 0, base_km: 0, per_km: 0 };
  const base = Number(t.base ?? 0);
  const baseKm = Number(t.base_km ?? 0);
  const perKm = Number(t.per_km ?? 0);
  if (distanceKm <= baseKm) return Math.round(base);
  return Math.round(base + perKm * (distanceKm - baseKm));
}

export function computeServiceFee(tariffs, deliveryFee) {
  const pct = Number(tariffs?.service_fee_percent ?? 0);
  return Math.round((deliveryFee || 0) * pct / 100);
}