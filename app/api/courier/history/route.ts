import { db, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { ok, requireAuth } from "@/lib/api";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(["courier"] as const)(async (
  _req: NextRequest,
  { session }
) => {
  const items = await db
    .select({
      d: schema.deliveries,
      app: schema.applications,
      product: schema.products,
    })
    .from(schema.deliveries)
    .leftJoin(
      schema.applications,
      eq(schema.deliveries.applicationId, schema.applications.id)
    )
    .leftJoin(
      schema.products,
      eq(schema.applications.productId, schema.products.id)
    )
    .where(
      and(
        eq(schema.deliveries.courierId, session.userId),
        eq(schema.deliveries.status, "delivered")
      )!
    )
    .orderBy(desc(schema.deliveries.completedAt));
  return ok({ items });
});
