import { base44 } from "@/api/base44Client";

// Client wrapper that mirrors the base44.entities.<X> API but routes Order CRUD
// to Supabase via the `supabaseCrud` backend function (which enforces ACL).
// Other entities stay on base44.entities until migrated.

function unwrap(r) {
  if (r && r.data && r.data.ok) return r.data.data;
  throw new Error((r && r.data && r.data.error) || "Supabase CRUD error");
}

async function invoke(payload) {
  return base44.functions.invoke("supabaseCrud", payload);
}

// Emulate base44 realtime subscriptions via polling (Supabase REST has no
// websocket subscription here). Calls back with { id, type, data } on changes.
function makeSubscribe(entity) {
  return function subscribe(callback) {
    const last = new Map();
    let initialized = false;
    const tick = async () => {
      try {
        const rows = await entity.filter({}, "-updated_date", 100);
        for (const r of rows) {
          const cur = r.updated_date || null;
          const prev = last.get(r.id);
          if (prev === undefined) {
            // First sync: record state silently so mount doesn't storm the
            // callback with one event per existing row.
            last.set(r.id, cur);
            if (initialized) callback({ id: r.id, type: "create", data: r });
          } else if (prev !== cur) {
            last.set(r.id, cur);
            callback({ id: r.id, type: "update", data: r });
          }
        }
        initialized = true;
      } catch {
        // ignore poll errors
      }
    };
    const h = setInterval(tick, 4000);
    return () => clearInterval(h);
  };
}

const Order = {
  async list(sort, limit) {
    return unwrap(await invoke({ table: "orders", op: "list", sort, limit }));
  },
  async filter(query, sort, limit) {
    return unwrap(await invoke({ table: "orders", op: "filter", query, sort, limit }));
  },
  async get(id) {
    return unwrap(await invoke({ table: "orders", op: "get", id }));
  },
  async create(data) {
    return unwrap(await invoke({ table: "orders", op: "create", data }));
  },
  async update(id, patch) {
    return unwrap(await invoke({ table: "orders", op: "update", id, patch }));
  },
};
Order.subscribe = makeSubscribe(Order);

export default { Order };