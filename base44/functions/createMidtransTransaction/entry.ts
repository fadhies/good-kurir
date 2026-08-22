import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { getSnapApiUrl, getAuthHeader } from "../../shared/midtrans.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return Response.json({ error: "orderId required" }, { status: 400 });

    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    if (order.created_by_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status !== "awaiting_payment") {
      return Response.json({ error: "Pesanan tidak dalam status menunggu pembayaran" }, { status: 400 });
    }

    const amount = Math.round(Number(order.item_cost) || 0);
    if (amount <= 0) return Response.json({ error: "Tagihan belum diatur" }, { status: 400 });

    const payload = {
      transaction_details: {
        order_id: `ORDER-${order.id}`,
        gross_amount: amount,
      },
      item_details: [
        {
          id: "item",
          price: amount,
          quantity: 1,
          name: order.store_name ? String(order.store_name).slice(0, 40) : "Tagihan Toko",
        },
      ],
      customer_details: {
        email: user.email || "customer@example.com",
        first_name: (user.full_name || "Pelanggan").slice(0, 50),
      },
      enabled_payments: [
        "credit_card",
        "gopay",
        "shopeepay",
        "qris",
        "dana",
        "ovo",
        "bca_va",
        "bni_va",
        "bri_va",
        "permata_va",
        "other_va",
        "alfamart",
        "indomaret",
        "akulaku",
      ],
    };

    const res = await fetch(getSnapApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      return Response.json(
        { error: data.error_message || "Gagal membuat transaksi Midtrans" },
        { status: 400 }
      );
    }

    return Response.json({
      token: data.token,
      redirect_url: data.redirect_url,
      client_key: secrets.get("MIDTRANS_CLIENT_KEY"),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}