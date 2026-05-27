import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { ok, requireAuth } from "@/lib/api";
import { syncOverdue } from "@/lib/services";
import type { NextRequest } from "next/server";

export const GET = await requireAuth()(async (
  _req: NextRequest,
  { session }
) => {
  await syncOverdue();
  const rows = await db
    .select({
      ins: schema.installments,
      app: schema.applications,
      product: schema.products,
    })
    .from(schema.installments)
    .leftJoin(
      schema.applications,
      eq(schema.installments.applicationId, schema.applications.id)
    )
    .leftJoin(
      schema.products,
      eq(schema.applications.productId, schema.products.id)
    )
    .where(eq(schema.installments.userId, session.userId))
    .orderBy(desc(schema.installments.dueDate));
  return ok({ items: rows });
});
