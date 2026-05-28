// Manual confirmation endpoint.
//
// Customer can NO LONGER mark their own payment as paid — that flow is
// reserved for the Midtrans webhook (see /api/webhooks/midtrans).
//
// For manual transfer / QRIS static, admins (Finance / Super Admin)
// reconcile the bank statement and call this endpoint to acknowledge.
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fail, ok, requireAuth } from "@/lib/api";
import {
  audit,
  notify,
  generateInstallmentSchedule,
} from "@/lib/services";
import type { NextRequest } from "next/server";

const ROLES = ["super_admin", "finance_admin"] as const;

export const POST = await requireAuth(ROLES)(async (
  _req: NextRequest,
  { params, session }
) => {
  const id = params?.id;
  if (!id) return fail("ID required", 400);
  const rows = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, id))
    .limit(1);
  if (!rows.length) return fail("Payment tidak ditemukan", 404);
  const p = rows[0];
  if (p.status === "paid") return ok({ alreadyPaid: true });

  const now = new Date();
  await db
    .update(schema.payments)
    .set({ status: "paid", paidAt: now })
    .where(eq(schema.payments.id, id));

  if (p.type === "dp") {
    await db
      .update(schema.applications)
      .set({ status: "purchasing" })
      .where(eq(schema.applications.id, p.applicationId));
    await notify({
      userId: p.userId,
      type: "payment_success",
      tone: "success",
      title: "DP diterima",
      body: "Tim kami akan segera membeli barangnya",
    });
  } else if (p.type === "installment" && p.installmentId) {
    await db
      .update(schema.installments)
      .set({ status: "paid", paidAt: now })
      .where(eq(schema.installments.id, p.installmentId));
    await notify({
      userId: p.userId,
      type: "payment_success",
      tone: "success",
      title: "Pembayaran cicilan diterima",
    });

    const remaining = await db
      .select()
      .from(schema.installments)
      .where(eq(schema.installments.applicationId, p.applicationId));
    if (remaining.every((i) => i.status === "paid")) {
      await db
        .update(schema.applications)
        .set({ status: "completed" })
        .where(eq(schema.applications.id, p.applicationId));
      const user = (
        await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, p.userId))
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

  await audit(session.userId, "payment.confirm.manual", "payments", id, {
    by: session.role,
  });
  return ok({ confirmed: true });
});
