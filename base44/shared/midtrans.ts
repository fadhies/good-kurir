import { secrets } from "base44:runtime";

// Sandbox endpoint. Ganti ke https://app.midtrans.com/snap/v1/transactions saat production.
export function getSnapApiUrl() {
  return "https://app.sandbox.midtrans.com/snap/v1/transactions";
}

export function getAuthHeader() {
  const serverKey = secrets.get("MIDTRANS_SERVER_KEY");
  return "Basic " + btoa(serverKey + ":");
}

// Midtrans notification signature: sha512(order_id + status_code + gross_amount + server_key)
export async function verifyMidtransSignature(orderId, statusCode, grossAmount, signatureKey) {
  const serverKey = secrets.get("MIDTRANS_SERVER_KEY");
  if (!serverKey || !signatureKey) return false;
  const raw = `${orderId}${statusCode || ""}${grossAmount || ""}${serverKey}`;
  const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(raw));
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hash === signatureKey;
}

export function isPaidStatus(transactionStatus, fraudStatus) {
  if (transactionStatus === "settlement") return true;
  if (transactionStatus === "capture" && (!fraudStatus || fraudStatus === "accept")) return true;
  return false;
}