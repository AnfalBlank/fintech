import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fail, ok, requireAuth } from "@/lib/api";
import { audit, notify, generateInstallmentSchedule } from "@/lib/services";
import type { NextRequest } from "next/server";

// Confirm payment — in real prod this is webhook from Midtrans/Xendit.
export const POST = await requireAuth(["customer", "super_admin", "finance_admin"] as const)(
  async (_req: NextRequest, { params, session }) => {
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
      // Move application to purchasing
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

      // Check if all installments paid → mark application completed
      const remaining = await db
        .select()
        .from(schema.installments)
        .where(eq(schema.installments.applicationId, p.applicationId));
      if (remaining.every((i) => i.status === "paid")) {
        await db
          .update(schema.applications)
          .set({ status: "completed" })
          .where(eq(schema.applications.id, p.applicationId));
        // Trust level upgrade
        const user = (
          await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, p.userId))
            .limit(1)
        )[0];
        if (user) {
          const newLvl = Math.min(3, user.trustLevel + 1);
          await db
            .update(schema.users)
            .set({
              trustLevel: newLvl,
              limit:
                newLvl === 3
                  ? 25_000_000
                  : newLvl === 2
                    ? 10_000_000
                    : 5_000_000,
            })
            .where(eq(schema.users.id, p.userId));
        }
      }
    }

    await audit(session.userId, "payment.confirm", "payments", id);
    return ok({ confirmed: true });
  }
);
