import { db, schema } from "@/db";
import { eq, sql, and } from "drizzle-orm";
import { ok, requireAuth } from "@/lib/api";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(["courier"] as const)(async (
  _req: NextRequest,
  { session }
) => {
  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.deliveries)
    .where(eq(schema.deliveries.courierId, session.userId));

  const [delivered] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.deliveries)
    .where(
      and(
        eq(schema.deliveries.courierId, session.userId),
        eq(schema.deliveries.status, "delivered")
      )!
    );

  const totalCount = Number(total?.count ?? 0);
  const deliveredCount = Number(delivered?.count ?? 0);

  return ok({
    total: totalCount,
    delivered: deliveredCount,
    pending: totalCount - deliveredCount,
    onTimePct: totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0,
  });
});
