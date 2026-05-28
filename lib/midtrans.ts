// Midtrans helpers — server-only.
import { createHash } from "node:crypto";
import { loadSettings } from "./settings";

export type MidtransNotification = {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  va_numbers?: { bank: string; va_number: string }[];
};

// Verify SHA-512 signature per Midtrans spec:
// signature = SHA512(order_id + status_code + gross_amount + serverKey)
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string
): boolean {
  if (!serverKey) return false;
  const expected = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return expected === signatureKey;
}

// Map Midtrans transaction_status + fraud_status to our payment status.
// Reference: https://docs.midtrans.com/en/after-payment/http-notification
export function mapPaymentStatus(
  transactionStatus: string,
  fraudStatus?: string
): "paid" | "pending" | "failed" | "expired" {
  if (transactionStatus === "capture" || transactionStatus === "settlement") {
    if (fraudStatus === "challenge") return "pending";
    return "paid";
  }
  if (transactionStatus === "pending") return "pending";
  if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "failure"
  )
    return "failed";
  if (transactionStatus === "expire") return "expired";
  return "pending";
}

export type CreateChargePayload = {
  payment_type: "bank_transfer" | "qris" | "gopay" | "shopeepay" | "qris_dynamic";
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  bank_transfer?: { bank: string };
  qris?: { acquirer?: string };
  gopay?: { enable_callback?: boolean };
  customer_details?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
};

export async function createCharge(
  body: CreateChargePayload
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  const s = await loadSettings();
  if (!s.midtransServerKey) {
    return { ok: false, error: "Midtrans server key belum diset" };
  }
  const baseUrl = s.midtransProduction
    ? "https://api.midtrans.com/v2/charge"
    : "https://api.sandbox.midtrans.com/v2/charge";

  const auth = Buffer.from(`${s.midtransServerKey}:`).toString("base64");
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.status_code?.startsWith("4") || data.status_code?.startsWith("5")) {
      return {
        ok: false,
        error: data.status_message ?? `Midtrans error ${res.status}`,
      };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
