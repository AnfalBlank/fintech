// Report builder — returns structured data + can be exported as CSV by client.
import { db, schema } from "@/db";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { ADMIN_ROLES_LIST, fail, ok, requireAuth } from "@/lib/api";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async (
  req: NextRequest
) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "summary";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
  const toDate = to ? new Date(to) : new Date();

  if (type === "applications") {
    const rows = await db
      .select({
        a: schema.applications,
        product: schema.products,
        user: { name: schema.users.name },
      })
      .from(schema.applications)
      .leftJoin(
        schema.products,
        eq(schema.applications.productId, schema.products.id)
      )
      .leftJoin(schema.users, eq(schema.applications.userId, schema.users.id))
      .where(
        and(
          gte(schema.applications.submittedAt, fromDate),
          lte(schema.applications.submittedAt, toDate)
        )!
      );
    return ok({ rows });
  }

  if (type === "payments") {
    const rows = await db
      .select({
        p: schema.payments,
        user: { name: schema.users.name },
      })
      .from(schema.payments)
      .leftJoin(schema.users, eq(schema.payments.userId, schema.users.id))
      .where(
        and(
          gte(schema.payments.createdAt, fromDate),
          lte(schema.payments.createdAt, toDate)
        )!
      );
    return ok({ rows });
  }

  if (type === "deliveries") {
    const rows = await db
      .select({
        d: schema.deliveries,
        courier: { name: schema.users.name },
      })
      .from(schema.deliveries)
      .leftJoin(schema.users, eq(schema.deliveries.courierId, schema.users.id))
      .where(
        and(
          gte(schema.deliveries.scheduledAt, fromDate),
          lte(schema.deliveries.scheduledAt, toDate)
        )!
      );
    return ok({ rows });
  }

  // summary
  const [appCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.applications)
    .where(
      and(
        gte(schema.applications.submittedAt, fromDate),
        lte(schema.applications.submittedAt, toDate)
      )!
    );

  const [approved] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.applications)
    .where(
      and(
        gte(schema.applications.submittedAt, fromDate),
        lte(schema.applications.submittedAt, toDate),
        sql`${schema.applications.status} in ('approved','dp_pending','purchasing','warehouse','delivering','active','completed')`
      )!
    );

  const [rejected] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.applications)
    .where(
      and(
        gte(schema.applications.submittedAt, fromDate),
        lte(schema.applications.submittedAt, toDate),
        eq(schema.applications.status, "rejected")
      )!
    );

  const [disbursed] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.applications.financed}), 0)` })
    .from(schema.applications)
    .where(
      and(
        gte(schema.applications.submittedAt, fromDate),
        lte(schema.applications.submittedAt, toDate),
        sql`${schema.applications.status} in ('purchasing','warehouse','delivering','active','completed')`
      )!
    );

  const [collected] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)` })
    .from(schema.payments)
    .where(
      and(
        gte(schema.payments.paidAt, fromDate),
        lte(schema.payments.paidAt, toDate),
        eq(schema.payments.status, "paid")
      )!
    );

  const [overdue] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.installments.amount}), 0)` })
    .from(schema.installments)
    .where(eq(schema.installments.status, "overdue"));

  return ok({
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    summary: {
      applications: appCount?.count ?? 0,
      approved: approved?.count ?? 0,
      rejected: rejected?.count ?? 0,
      approvalRate:
        (appCount?.count ?? 0) > 0
          ? Math.round(((approved?.count ?? 0) / appCount.count) * 100)
          : 0,
      disbursed: disbursed?.total ?? 0,
      collected: collected?.total ?? 0,
      overdue: overdue?.total ?? 0,
    },
  });
});
