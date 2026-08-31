import { secrets } from "base44:runtime";

// Thin PostgREST client. All calls use the service_role key so they bypass RLS.
// Frontend never uses this directly; only Base44 backend functions import it.

function cfg() {
  const url = (secrets.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const key = secrets.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  return { url, key };
}

function tpath(table) {
  return encodeURIComponent(table);
}

function headers(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

// Upsert rows on primary key (id). Batches to keep payloads small.
export async function upsertMany(table, rows) {
  if (!rows || rows.length === 0) return { table, count: 0 };
  const { url, key } = cfg();
  const batchSize = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const res = await fetch(`${url}/rest/v1/${tpath(table)}`, {
      method: "POST",
      headers: headers(key, { Prefer: "return=representation,resolution=merge-duplicates" }),
      body: JSON.stringify(slice),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Supabase upsert ${table} ${res.status}: ${t}`);
    }
    done += slice.length;
  }
  return { table, count: done };
}

// Select with optional filter object { col: value } and optional order.
export async function selectWhere(table, filter = {}, order) {
  const { url, key } = cfg();
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null) continue;
    params.append(k, `eq.${v}`);
  }
  if (order) params.append("order", order);
  const qs = params.toString();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}${qs ? "?" + qs : ""}`, { headers: headers(key) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase select ${table} ${res.status}: ${t}`);
  }
  return res.json();
}

// Paginated full scan of a table.
export async function selectAll(table, order = "id") {
  const { url, key } = cfg();
  const rows = [];
  let from = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(`${url}/rest/v1/${tpath(table)}?order=${order}`, {
      headers: { ...headers(key), Range: `${from}-${from + limit - 1}` },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Supabase selectAll ${table} ${res.status}: ${t}`);
    }
    const batch = await res.json();
    rows.push(...batch);
    const range = res.headers.get("content-range");
    const total = range ? parseInt(range.split("/")[1], 10) : NaN;
    if (!batch.length || (range && (!isNaN(total) && rows.length >= total))) break;
    from += limit;
  }
  return rows;
}

// Delete rows matching a filter { col: value }.
export async function deleteWhere(table, filter = {}) {
  const { url, key } = cfg();
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null) continue;
    params.append(k, `eq.${v}`);
  }
  const qs = params.toString();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}${qs ? "?" + qs : ""}`, {
    method: "DELETE",
    headers: headers(key, { Prefer: "return=representation" }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase delete ${table} ${res.status}: ${t}`);
  }
  return res.json();
}

// Get a single row by primary key (id).
export async function getById(table, id) {
  const { url, key } = cfg();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}?id=eq.${encodeURIComponent(id)}`, { headers: headers(key) });
  if (!res.ok) throw new Error(`Supabase getById ${table} ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// Insert one row; returns the inserted row.
export async function insertOne(table, row) {
  const { url, key } = cfg();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}`, {
    method: "POST",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table} ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : row;
}

// Patch a single row by id; returns the updated row.
export async function updateById(table, id, patch) {
  const { url, key } = cfg();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase update ${table} ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : { id, ...patch };
}

// Delete a single row by id.
export async function deleteById(table, id) {
  const { url, key } = cfg();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: headers(key),
  });
  if (!res.ok) throw new Error(`Supabase deleteById ${table} ${res.status}: ${await res.text()}`);
}

// Flexible select with eq / $in filters, optional `or` group, order, limit.
export async function selectQuery(table, { filter = {}, order, limit, or } = {}) {
  const { url, key } = cfg();
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null) continue;
    if (v && typeof v === "object" && Array.isArray(v.$cs)) {
      // jsonb array containment: column @> [...]
      params.set(k, "cs." + JSON.stringify(v.$cs));
    } else if (v && typeof v === "object" && Array.isArray(v.$in)) {
      params.set(k, "in.(" + v.$in.map(String).join(",") + ")");
    } else {
      params.set(k, "eq." + String(v));
    }
  }
  if (or) params.set("or", or);
  if (order) {
    const desc = order.startsWith("-");
    const col = desc ? order.slice(1) : order;
    params.set("order", col + (desc ? ".desc" : ".asc"));
  }
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}${qs ? "?" + qs : ""}`, { headers: headers(key) });
  if (!res.ok) throw new Error(`Supabase selectQuery ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

// Patch all rows matching an eq filter { col: value }. Used for bulk updates
// like "mark all my unread notifications as read".
export async function updateWhere(table, filter = {}, patch = {}) {
  const { url, key } = cfg();
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null) continue;
    params.append(k, `eq.${v}`);
  }
  const qs = params.toString();
  const res = await fetch(`${url}/rest/v1/${tpath(table)}${qs ? "?" + qs : ""}`, {
    method: "PATCH",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase updateWhere ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

// Create a Storage bucket if it doesn't already exist (409 = already exists).
export async function ensureBucket(bucket, isPublic = true) {
  const { url, key } = cfg();
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: bucket, name: bucket, public: isPublic }),
  });
  if (!res.ok) {
    const t = await res.text();
    // Supabase may return 400 (or 409) with a body indicating the bucket
    // already exists — treat that as success, not an error.
    if (res.status === 409 || /BucketAlreadyExists|already exists/i.test(t)) {
      return true;
    }
    throw new Error(`Supabase ensureBucket ${res.status}: ${t}`);
  }
  return true;
}

// Upload a base64-encoded object to a Storage bucket; returns the public URL.
export async function uploadObject(bucket, path, base64Data, contentType) {
  const { url, key } = cfg();
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const enc = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${enc}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase upload ${bucket}/${path} ${res.status}: ${t}`);
  }
  return `${url}/storage/v1/object/public/${bucket}/${enc}`;
}