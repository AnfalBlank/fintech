import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit, notify } from "@/lib/services";
import { newId } from "@/lib/ids";
import type { NextRequest } from "next/server";

const ROLES = ["super_admin", "finance_admin"] as const;

export const GET = await requireAuth(ROLES)(async () => {
  const items = await db
    .select({
      r: schema.refunds,
      app: schema.applications,
      user: { id: schema.users.id, name: schema.users.name },
    })
    .from(schema.refunds)
    .leftJoin(
      schema.applications,
      eq(schema.refunds.applicationId, schema.applications.id)
    )
    .leftJoin(schema.users, eq(schema.refunds.userId, schema.users.id))
    .orderBy(desc(schema.refunds.createdAt));
  return ok({ items });
});

const Body = z.object({
  applicationId: z.string(),
  paymentId: z.string().optional(),
  amount: z.number().int().positive(),
  reason: z.string().min(5),
});

export const POST = await requireAuth(ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);

  const app = (
    await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, parsed.data.applicationId))
      .limit(1)
  )[0];
  if (!app) return fail("Application tidak ditemukan", 404);

  const id = newId("RFD");
  await db.insert(schema.refunds).values({
    id,
    applicationId: parsed.data.applicationId,
    paymentId: parsed.data.paymentId ?? null,
    userId: app.userId,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
    status: "pending",
  });

  await audit(session.userId, "refund.create", "refunds", id, parsed.data);
  await notify({
    userId: app.userId,
    type: "system",
    tone: "info",
    title: "Permintaan refund terkirim",
    body: `Refund ${parsed.data.amount.toLocaleString("id-ID")} sedang diproses.`,
  });

  return ok({ id });
});

const Action = z.object({
  refundId: z.string(),
  action: z.enum(["process", "reject"]),
  note: z.string().optional(),
});

export const PATCH = await requireAuth(ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Action);
  if (!parsed.ok) return fail(parsed.error, 400);

  const refund = (
    await db
      .select()
      .from(schema.refunds)
      .where(eq(schema.refunds.id, parsed.data.refundId))
      .limit(1)
  )[0];
  if (!refund) return fail("Refund tidak ditemukan", 404);

  const status = parsed.data.action === "process" ? "processed" : "rejected";
  await db
    .update(schema.refunds)
    .set({
      status,
      processedBy: session.userId,
      processedAt: new Date(),
    })
    .where(eq(schema.refunds.id, refund.id));

  if (status === "processed") {
    // Cancel application if still in pre-delivery stages
    const appRow = (
      await db
        .select({ status: schema.applications.status })
        .from(schema.applications)
        .where(eq(schema.applications.id, refund.applicationId))
        .limit(1)
    )[0];
    if (
      appRow &&
      (["dp_pending", "approved", "purchasing", "warehouse"] as const).includes(
        appRow.status as any
      )
    ) {
      await db
        .update(schema.applications)
        .set({
          status: "rejected",
          rejectReason: "Refunded: " + (parsed.data.note ?? ""),
        })
        .where(eq(schema.applications.id, refund.applicationId));
    }
  }

  await notify({
    userId: refund.userId,
    type: "system",
    tone: status === "processed" ? "success" : "warning",
    title:
      status === "processed"
        ? "Refund diproses"
        : "Permintaan refund ditolak",
    body: parsed.data.note,
  });

  await audit(
    session.userId,
    `refund.${parsed.data.action}`,
    "refunds",
    refund.id,
    { note: parsed.data.note }
  );

  return ok({ status });
});
