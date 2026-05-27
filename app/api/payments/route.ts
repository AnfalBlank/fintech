import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { newReference, paymentId } from "@/lib/ids";
import { audit, notify, generateInstallmentSchedule } from "@/lib/services";
import type { NextRequest } from "next/server";

const Body = z.object({
  applicationId: z.string(),
  installmentId: z.string().optional(),
  type: z.enum(["dp", "installment", "penalty"]),
  method: z.enum(["va", "qris", "ewallet"]),
  channel: z.string().optional(),
  amount: z.number().int().positive(),
});

// POST /api/payments — create payment intent (PRD §11 Step 8 + cicilan)
export const POST = await requireAuth(["customer"] as const)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { applicationId: appId, installmentId, type, method, channel, amount } =
    parsed.data;

  const app = (
    await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, appId))
      .limit(1)
  )[0];
  if (!app) return fail("Application tidak ditemukan", 404);
  if (app.userId !== session.userId) return fail("Forbidden", 403);

  const id = paymentId();
  const ref = newReference("MGL");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(schema.payments).values({
    id,
    applicationId: appId,
    installmentId: installmentId ?? null,
    userId: session.userId,
    type,
    method,
    channel: channel ?? null,
    amount,
    referenceNo: ref,
    status: "pending",
    expiresAt,
  });

  await audit(session.userId, "payment.create", "payments", id, {
    type,
    method,
    amount,
  });

  // VA / QRIS payload (mock)
  const payload =
    method === "va"
      ? {
          va: "8800-1029-3344-1199",
          bank: channel ?? "BCA",
          referenceNo: ref,
          accountName: "PT. Manggala Utama Indonesia",
        }
      : method === "qris"
        ? { qrCode: `QRIS:${ref}` }
        : { deepLink: `${(channel ?? "gopay").toLowerCase()}://pay/${ref}` };

  return ok({ paymentId: id, referenceNo: ref, expiresAt, payload });
});

// GET /api/payments?applicationId=...
export const GET = await requireAuth()(async (req: NextRequest, { session }) => {
  const url = new URL(req.url);
  const appId = url.searchParams.get("applicationId");
  let q = db.select().from(schema.payments).$dynamic();
  if (appId) q = q.where(eq(schema.payments.applicationId, appId));
  else q = q.where(eq(schema.payments.userId, session.userId));
  const items = await q;
  return ok({ items });
});
