import { db, schema } from "@/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit } from "@/lib/services";
import type { NextRequest } from "next/server";

const ROLES = ["super_admin", "finance_admin"] as const;

// GET — applications ready to be disbursed:
//   status in ('purchasing', 'dp_pending', 'warehouse', 'approved')
//   OR DP confirmed and asset to_purchase
export const GET = await requireAuth(ROLES)(async () => {
  const items = await db
    .select({
      app: schema.applications,
      product: schema.products,
      user: {
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
      },
      asset: schema.assets,
      // DP paid?
      dpPaidSum: sql<number>`(select coalesce(sum(${schema.payments.amount}), 0) from ${schema.payments} where ${schema.payments.applicationId} = ${schema.applications.id} and ${schema.payments.type} = 'dp' and ${schema.payments.status} = 'paid')`,
    })
    .from(schema.applications)
    .leftJoin(
      schema.products,
      eq(schema.applications.productId, schema.products.id)
    )
    .leftJoin(schema.users, eq(schema.applications.userId, schema.users.id))
    .leftJoin(
      schema.assets,
      eq(schema.assets.applicationId, schema.applications.id)
    )
    .where(
      sql`${schema.applications.status} in ('approved', 'dp_pending', 'purchasing', 'warehouse')`
    )
    .orderBy(desc(schema.applications.submittedAt));

  // Compute KPIs
  const [pendingDp] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.applications.dpAmount}), 0)` })
    .from(schema.applications)
    .where(eq(schema.applications.status, "dp_pending"));

  const [readyDisburse] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.applications.financed}), 0)` })
    .from(schema.applications)
    .where(eq(schema.applications.status, "purchasing"));

  return ok({
    items,
    kpi: {
      pendingDp: pendingDp?.total ?? 0,
      readyDisburse: readyDisburse?.total ?? 0,
    },
  });
});

const MarkDisbursed = z.object({
  applicationIds: z.array(z.string()).min(1),
  invoiceNo: z.string().optional(),
});

// POST — bulk mark as purchased (skip explicit warehouse/qc step for express purchase).
export const POST = await requireAuth(ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, MarkDisbursed);
  if (!parsed.ok) return fail(parsed.error, 400);

  await db
    .update(schema.applications)
    .set({ status: "warehouse" })
    .where(inArray(schema.applications.id, parsed.data.applicationIds));

  for (const id of parsed.data.applicationIds) {
    await audit(session.userId, "disbursement.mark", "applications", id, {
      invoiceNo: parsed.data.invoiceNo,
    });
  }

  return ok({ updated: parsed.data.applicationIds.length });
});
