import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { ok, requireAuth, ADMIN_ROLES_LIST } from "@/lib/api";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async () => {
  // PRD §19 Finance KPIs.
  const [outstandingRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.installments.amount}), 0)`,
    })
    .from(schema.installments)
    .where(
      sql`${schema.installments.status} in ('upcoming', 'due', 'overdue')`
    );

  const [overdueRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.installments.amount} + ${schema.installments.penaltyAmount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(schema.installments)
    .where(eq(schema.installments.status, "overdue"));

  const [paidRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.installments.amount}), 0)`,
    })
    .from(schema.installments)
    .where(eq(schema.installments.status, "paid"));

  const [usersRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(eq(schema.users.role, "customer"));

  const [appRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.applications.financed}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(schema.applications);

  const [marginRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.applications.total} - ${schema.applications.dpAmount}), 0)`,
    })
    .from(schema.applications);

  const outstanding = outstandingRow?.total ?? 0;
  const overdue = overdueRow?.total ?? 0;
  const paid = paidRow?.total ?? 0;
  const totalDue = outstanding + paid;
  const collectionRate = totalDue > 0 ? (paid / totalDue) * 100 : 100;
  const nplRatio =
    outstanding + paid > 0
      ? (overdue / (outstanding + paid + overdue)) * 100
      : 0;

  return ok({
    kpi: {
      outstanding,
      overdue,
      paid,
      activeUsers: usersRow?.count ?? 0,
      totalApplications: appRow?.count ?? 0,
      collectionRate: Math.round(collectionRate * 100) / 100,
      nplRatio: Math.round(nplRatio * 100) / 100,
      profit: marginRow?.total ?? 0,
    },
  });
});
