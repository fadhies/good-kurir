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

// Tarif antar:
// - antar barang & antar orang: tarif tunggal Rp12.000 / 4km, +Rp2.000/km
// - beli makanan: mode hemat (Rp7.000/4km, +Rp1.000/km) atau cepat (Rp12.000/4km, +Rp2.000/km)
export function calcDeliveryFee(distanceKm, mode = "hemat", type = "food") {
  const BASE_KM = 4;
  if (type === "goods" || type === "person") {
    const baseFare = 12000;
    const perKm = 2000;
    if (distanceKm <= BASE_KM) return baseFare;
    return Math.round(baseFare + perKm * (distanceKm - BASE_KM));
  }
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

// Ringkas alamat: buang kelurahan, kecamatan, kabupaten, negara, dan kode pos.
export function shortAddress(address) {
  if (!address) return "";
  const DROP = [
    /^kel(urahan)?\b/i,
    /^kec(amatan)?\b/i,
    /^kab(upaten)?\b/i,
    /^prov(insi)?\b/i,
    /^indonesia$/i,
    /^\d{4,5}$/,
  ];
  return address
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !DROP.some((re) => re.test(s)))
    .join(", ");
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}