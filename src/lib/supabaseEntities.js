import { base44 } from "@/api/base44Client";

// Client wrapper that mirrors the base44.entities.<X> API but routes CRUD for
// migrated entities to Supabase via the `supabaseCrud` backend function
// (which enforces per-table ACL server-side).

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

function makeEntity(table) {
  const entity = {
    async list(sort, limit) {
      return unwrap(await invoke({ table, op: "list", sort, limit }));
    },
    async filter(query, sort, limit) {
      return unwrap(await invoke({ table, op: "filter", query, sort, limit }));
    },
    async get(id) {
      return unwrap(await invoke({ table, op: "get", id }));
    },
    async create(data) {
      return unwrap(await invoke({ table, op: "create", data }));
    },
    async update(id, patch) {
      return unwrap(await invoke({ table, op: "update", id, patch }));
    },
    async updateMany(query, patch) {
      return unwrap(await invoke({ table, op: "updateMany", query, patch }));
    },
  };
  entity.subscribe = makeSubscribe(entity);
  return entity;
}

const Order = makeEntity("orders");
const Notification = makeEntity("notifications");
const ChatMessage = makeEntity("chat_messages");
const WalletTransaction = makeEntity("wallet_transactions");

export default { Order, Notification, ChatMessage, WalletTransaction };