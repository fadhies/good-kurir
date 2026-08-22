export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Tarif antar berdasarkan mode:
// - hemat: Rp7.000 untuk 0-4 km, +Rp1.000/km setelahnya
// - cepat: Rp12.000 untuk 0-4 km, +Rp2.000/km setelahnya
export function calcDeliveryFee(distanceKm, mode = "hemat") {
  const BASE_KM = 4;
  if (mode === "cepat") {
    const baseFare = 12000;
    const perKm = 2000;
    if (distanceKm <= BASE_KM) return baseFare;
    return Math.round(baseFare + perKm * (distanceKm - BASE_KM));
  }
  const baseFare = 7000;
  const perKm = 1000;
  if (distanceKm <= BASE_KM) return baseFare;
  return Math.round(baseFare + perKm * (distanceKm - BASE_KM));
}

// Dari tarif yang dibayar konsumen, dipotong Rp2.000 per order
// (Rp1.000 fee admin + Rp1.000 fee aplikasi), sisanya untuk driver.
export function calcFees(deliveryFee) {
  const appFee = 1000;
  const adminFee = 1000;
  const driverEarning = Math.max(0, (deliveryFee || 0) - appFee - adminFee);
  return { app_fee: appFee, admin_fee: adminFee, driver_earning: driverEarning };
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}