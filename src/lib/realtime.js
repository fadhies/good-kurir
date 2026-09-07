import { createClient } from "@supabase/supabase-js";
import { base44 } from "@/api/base44Client";

// Sinyal realtime via Supabase Broadcast. Trigger database
// (base44/shared/realtime.sql) mengirim payload MINIMAL (id/status saja) ke
// topik channel; data lengkap selalu ditarik ulang lewat endpoint ACL
// (supabaseCrud), jadi tidak ada data yang bocor lewat channel publik.

let clientPromise = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const res = await base44.functions.invoke("realtimeConfig", {});
      const { url, anonKey } = res.data || {};
      if (!url || !anonKey) throw new Error("Realtime belum dikonfigurasi");
      return createClient(url, anonKey, {
        realtime: { params: { eventsPerSecond: 10 } },
      });
    })();
    clientPromise.catch(() => { clientPromise = null; });
  }
  return clientPromise;
}

// Berlangganan sinyal "ada perubahan" pada sebuah topik.
// Mengembalikan Promise<unsubscribe>; tidak pernah melempar error.
export async function subscribeTopic(topic, onChange) {
  let client;
  try {
    client = await getClient();
  } catch {
    return () => {};
  }
  let disposed = false;
  const channel = client.channel(topic);
  const handler = () => onChange();
  ["INSERT", "UPDATE", "DELETE"].forEach((event) =>
    channel.on("broadcast", { event }, handler)
  );
  channel.subscribe();
  return () => {
    if (disposed) return;
    disposed = true;
    client.removeChannel(channel);
  };
}

export const subscribeOrder = (orderId, cb) =>
  subscribeTopic(`order:${orderId}`, cb);

export const subscribeUser = (userId, cb) =>
  subscribeTopic(`user:${userId}`, cb);

export const subscribeOrders = (cb) => subscribeTopic("orders:all", cb);

export const subscribeWithdrawals = (cb) =>
  subscribeTopic("withdrawals:all", cb);