import { db, schema } from "@/db";
import { and, eq, desc, like, or, sql } from "drizzle-orm";
import { ADMIN_ROLES_LIST, ok, requireAuth } from "@/lib/api";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async (
  req: NextRequest
) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status");
  const trust = url.searchParams.get("trust");

  let query = db
    .select({
      user: schema.users,
      apps: sql<number>`(select count(*) from ${schema.applications} where ${schema.applications.userId} = ${schema.users.id})`,
      outstanding: sql<number>`(select coalesce(sum(${schema.installments.amount}), 0) from ${schema.installments} where ${schema.installments.userId} = ${schema.users.id} and ${schema.installments.status} in ('upcoming', 'due', 'overdue'))`,
      overdueDays: sql<number>`(select coalesce(max((unixepoch() - unixepoch(${schema.installments.dueDate})) / 86400), 0) from ${schema.installments} where ${schema.installments.userId} = ${schema.users.id} and ${schema.installments.status} = 'overdue')`,
    })
    .from(schema.users)
    .where(eq(schema.users.role, "customer"))
    .orderBy(desc(schema.users.createdAt))
    .$dynamic();

  if (q) {
    query = query.where(
      or(
        like(schema.users.name, `%${q}%`),
        like(schema.users.email, `%${q}%`),
        like(schema.users.phone, `%${q}%`),
        like(schema.users.ktpNumber, `%${q}%`)
      )!
    );
  }
  if (status) {
    query = query.where(eq(schema.users.status, status as any));
  }
  if (trust) {
    query = query.where(eq(schema.users.trustLevel, Number(trust)));
  }

  const items = await query.limit(200);
  return ok({ items });
});
