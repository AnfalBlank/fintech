// Customer monthly statement PDF.
import { db, schema } from "@/db";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { fail, requireAuth } from "@/lib/api";
import { renderStatement } from "@/lib/pdf/statement";
import { audit } from "@/lib/services";
import type { NextRequest } from "next/server";

export const GET = await requireAuth()(async (
  req: NextRequest,
  { session }
) => {
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  // Default: last 30 days
  const to = toStr ? new Date(toStr) : new Date();
  const from = fromStr
    ? new Date(fromStr)
    : new Date(to.getTime() - 30 * 86400000);

  const user = (
    await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1)
  )[0];
  if (!user) return fail("User tidak ditemukan", 404);

  const apps = await db
    .select({ a: schema.applications, p: schema.products })
    .from(schema.applications)
    .leftJoin(
      schema.products,
      eq(schema.applications.productId, schema.products.id)
    )
    .where(eq(schema.applications.userId, session.userId))
    .orderBy(desc(schema.applications.submittedAt));

  // Compute per-app outstanding from installments
  const appRows = await Promise.all(
    apps.map(async (row) => {
      const inss = await db
        .select()
        .from(schema.installments)
        .where(eq(schema.installments.applicationId, row.a.id));
      const paid = inss
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.amount, 0);
      const outstanding = inss
        .filter((i) => i.status !== "paid")
        .reduce((s, i) => s + i.amount, 0);
      return {
        id: row.a.id,
        productTitle: row.p?.title ?? "—",
        total: row.a.total,
        paid,
        outstanding,
        status: row.a.status,
      };
    })
  );

  const payments = await db
    .select()
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.userId, session.userId),
        eq(schema.payments.status, "paid"),
        gte(schema.payments.paidAt, from),
        lte(schema.payments.paidAt, to)
      )!
    )
    .orderBy(desc(schema.payments.paidAt));

  const upcoming = await db
    .select()
    .from(schema.installments)
    .where(
      and(
        eq(schema.installments.userId, session.userId),
        // any unpaid (upcoming/due/overdue)
      )!
    );
  const upcomingFiltered = upcoming
    .filter((i) => i.status !== "paid")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 12);

  const buffer = await renderStatement({
    statementNo: `STM-${session.userId.slice(-6)}-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date(),
    period: { from, to },
    customer: { name: user.name, phone: user.phone, email: user.email },
    applications: appRows,
    payments: payments.map((p) => ({
      id: p.id,
      type: p.type,
      method: p.method,
      amount: p.amount,
      paidAt: p.paidAt ?? new Date(),
      referenceNo: p.referenceNo,
      applicationId: p.applicationId,
    })),
    upcomingInstallments: upcomingFiltered.map((i) => ({
      sequence: i.sequence,
      amount: i.amount,
      dueDate: i.dueDate,
      applicationId: i.applicationId,
      status: i.status,
    })),
  });

  await audit(session.userId, "statement.download", "users", session.userId);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="statement-${user.name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      "cache-control": "private, no-cache",
    },
  });
});
