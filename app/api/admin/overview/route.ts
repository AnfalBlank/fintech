import { db, schema } from "@/db";
import { sql, eq } from "drizzle-orm";
import { ok, requireAuth, ADMIN_ROLES_LIST } from "@/lib/api";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async () => {
  const [pending] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.applications)
    .where(
      sql`${schema.applications.status} in ('pending', 'manual_review')`
    );

  const [today] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.applications)
    .where(eq(schema.applications.status, "approved"));

  const [activeDelivery] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.deliveries)
    .where(
      sql`${schema.deliveries.status} in ('assigned','in_transit','picked_up')`
    );

  const [qcDone] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.assets)
    .where(eq(schema.assets.qcStatus, "passed"));

  const [fraudOpen] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.fraudLogs)
    .where(eq(schema.fraudLogs.status, "open"));

  // Risk distribution
  const grades = await db
    .select({
      grade: schema.applications.riskGrade,
      count: sql<number>`count(*)`,
    })
    .from(schema.applications)
    .groupBy(schema.applications.riskGrade);

  return ok({
    pending: pending?.count ?? 0,
    todayApproved: today?.count ?? 0,
    activeDeliveries: activeDelivery?.count ?? 0,
    qcDone: qcDone?.count ?? 0,
    fraudOpen: fraudOpen?.count ?? 0,
    riskDistribution: grades,
  });
});
