import { db, schema } from "@/db";
import { eq, desc, ne, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  APPROVAL_ROLES,
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit } from "@/lib/services";
import { generateInstallmentSchedule, notify } from "@/lib/services";
import type { NextRequest } from "next/server";

// GET — list assets in PO/warehouse stages
export const GET = await requireAuth(APPROVAL_ROLES)(async () => {
  const items = await db
    .select({
      asset: schema.assets,
      app: schema.applications,
      product: schema.products,
    })
    .from(schema.assets)
    .leftJoin(
      schema.applications,
      eq(schema.assets.applicationId, schema.applications.id)
    )
    .leftJoin(
      schema.products,
      eq(schema.applications.productId, schema.products.id)
    )
    .where(
      or(
        eq(schema.assets.status, "to_purchase"),
        eq(schema.assets.status, "purchased"),
        eq(schema.assets.status, "in_warehouse")
      )!
    )
    .orderBy(desc(schema.assets.createdAt));
  return ok({ items });
});

// POST — record purchase (PRD §11 Step 9)
const RecordBody = z.object({
  assetId: z.string(),
  invoiceNo: z.string().min(2),
});

export const POST = await requireAuth(APPROVAL_ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, RecordBody);
  if (!parsed.ok) return fail(parsed.error, 400);
  const now = new Date();
  await db
    .update(schema.assets)
    .set({
      status: "purchased",
      purchaseInvoiceNo: parsed.data.invoiceNo,
      purchasedAt: now,
      purchasedBy: session.userId,
    })
    .where(eq(schema.assets.id, parsed.data.assetId));
  await audit(session.userId, "po.purchase", "assets", parsed.data.assetId, {
    invoice: parsed.data.invoiceNo,
  });
  return ok({ purchased: true });
});
