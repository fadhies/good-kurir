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

// Pembaruan data kini memakai sinyal Supabase Realtime Broadcast (trigger
// database) — lihat src/lib/realtime.js dan base44/shared/realtime.sql.

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
  return entity;
}

const Order = makeEntity("orders");
const DriverProfile = makeEntity("driver_profiles");
const Notification = makeEntity("notifications");
const ChatMessage = makeEntity("chat_messages");
const WalletTransaction = makeEntity("wallet_transactions");
const WithdrawalRequest = makeEntity("withdrawal_requests");
const DriverRemittance = makeEntity("driver_remittances");
const AppSetting = makeEntity("app_settings");

export default { Order, DriverProfile, Notification, ChatMessage, WalletTransaction, WithdrawalRequest, DriverRemittance, AppSetting };