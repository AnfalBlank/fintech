// Midtrans HTTP notification handler.
// Auth: SHA-512 signature_key — verifySignature against server key.
// Idempotency: status updates are safe to replay; we only act if status changes.
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { audit, generateInstallmentSchedule, notify } from "@/lib/services";
import {
  mapPaymentStatus,
  verifySignature,
  type MidtransNotification,
} from "@/lib/midtrans";
import { loadSettings } from "@/lib/settings";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Rate limit per IP — Midtrans should hit a single endpoint, this guards
  // against replay storms from a leaked notification.
  const limited = await enforceRateLimit(req, "midtrans-webhook", {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  let body: MidtransNotification;
  try {
    body = (await req.json()) as MidtransNotification;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const settings = await loadSettings();
  if (!settings.midtransServerKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "midtrans not configured" }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }

  if (
    !verifySignature(
      body.order_id,
      body.status_code,
      body.gross_amount,
      body.signature_key,
      settings.midtransServerKey
    )
  ) {
    return new Response(
      JSON.stringify({ ok: false, error: "signature mismatch" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  // We use referenceNo as Midtrans order_id when calling charge.
  const refNo = body.order_id;
  const payment = (
    await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.referenceNo, refNo))
      .limit(1)
  )[0];

  if (!payment) {
    // Don't 404 to Midtrans — they retry. Acknowledge so they stop.
    return new Response(
      JSON.stringify({ ok: true, ignored: "unknown reference" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  const newStatus = mapPaymentStatus(body.transaction_status, body.fraud_status);
  if (payment.status === newStatus) {
    return new Response(JSON.stringify({ ok: true, idempotent: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const now = new Date();
  await db
    .update(schema.payments)
    .set({
      status: newStatus,
      paidAt: newStatus === "paid" ? now : payment.paidAt,
    })
    .where(eq(schema.payments.id, payment.id));

  if (newStatus === "paid") {
    if (payment.type === "dp") {
      await db
        .update(schema.applications)
        .set({ status: "purchasing" })
        .where(eq(schema.applications.id, payment.applicationId));
      await notify({
        userId: payment.userId,
        type: "payment_success",
        tone: "success",
        title: "DP diterima",
        body: "Tim Manggala akan segera membeli barangnya.",
      });
    } else if (payment.type === "installment" && payment.installmentId) {
      await db
        .update(schema.installments)
        .set({ status: "paid", paidAt: now })
        .where(eq(schema.installments.id, payment.installmentId));
      await notify({
        userId: payment.userId,
        type: "payment_success",
        tone: "success",
        title: "Pembayaran cicilan diterima",
      });

      // If all installments paid → mark application completed + bump trust.
      const remaining = await db
        .select()
        .from(schema.installments)
        .where(eq(schema.installments.applicationId, payment.applicationId));
      if (remaining.every((i) => i.status === "paid")) {
        await db
          .update(schema.applications)
          .set({ status: "completed" })
          .where(eq(schema.applications.id, payment.applicationId));
        const user = (
          await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, payment.userId))
            .limit(1)
        )[0];
        if (user) {
          const newLvl = Math.min(3, user.trustLevel + 1) as 1 | 2 | 3;
          const { getLimitForTrustLevel } = await import("@/lib/financing");
          await db
            .update(schema.users)
            .set({
              trustLevel: newLvl,
              limit: getLimitForTrustLevel(newLvl),
            })
            .where(eq(schema.users.id, user.id));
          if (newLvl > user.trustLevel) {
            await notify({
              userId: user.id,
              type: "system",
              tone: "success",
              title: `Naik ke Trust Level ${newLvl} 🎉`,
              body: `Limit baru ${getLimitForTrustLevel(newLvl).toLocaleString("id-ID")}`,
            });
          }
        }
      }
    }
  }

  await audit(null, "midtrans.webhook", "payments", payment.id, {
    refNo,
    transaction_status: body.transaction_status,
    fraud_status: body.fraud_status,
    newStatus,
  });

  return new Response(JSON.stringify({ ok: true, status: newStatus }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
