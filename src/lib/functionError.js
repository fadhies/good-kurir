// Ekstrak pesan error dari base44.functions.invoke yang throw pada respons non-2xx.
// Body error ada di err.response.data; e.message hanya berisi "Request failed with status 4xx".
export function getFunctionError(e) {
  const body = e?.response?.data;
  if (body && typeof body === "object" && body.error) return body.error;
  if (typeof body === "string" && body) return body;
  return e?.message || "Terjadi kesalahan";
}