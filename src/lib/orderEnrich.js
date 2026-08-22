import { reverseGeocodePoi } from "@/lib/googleMaps";
import { base44 } from "@/api/base44Client";

// Backfill store_name (nama POI) untuk order lama yang store_name-nya kosong
// atau hanya berupa pecahan alamat jalan. Dipersist agar tidak diulang.
export async function enrichOrdersStoreName(orders, onUpdated) {
  const candidates = (orders || []).filter(
    (o) =>
      o.store_lat != null &&
      o.store_lng != null &&
      (!o.store_name || o.store_name === (o.store_address || "").split(",")[0].trim())
  );
  await Promise.all(
    candidates.map(async (o) => {
      try {
        const { name } = await reverseGeocodePoi(o.store_lat, o.store_lng);
        if (name && name !== o.store_name) {
          await base44.entities.Order.update(o.id, { store_name: name });
          onUpdated?.(o.id, name);
        }
      } catch {}
    })
  );
}