import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fail, ok, requireAuth } from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const GET = await requireAuth()(async (
  _req: NextRequest,
  { params, session }
) => {
  const id = params?.id;
  if (!id) return fail("ID required", 400);

  const rows = await db
    .select({
      app: schema.applications,
      product: schema.products,
      user: schema.users,
      risk: schema.riskScores,
    })
    .from(schema.applications)
    .leftJoin(
      schema.products,
      eq(schema.applications.productId, schema.products.id)
    )
    .leftJoin(schema.users, eq(schema.applications.userId, schema.users.id))
    .leftJoin(
      schema.riskScores,
      eq(schema.riskScores.applicationId, schema.applications.id)
    )
    .where(eq(schema.applications.id, id))
    .limit(1);

  if (!rows.length) return fail("Tidak ditemukan", 404);
  const row = rows[0];

  // Customer can only access their own
  if (!isAdmin(session.role) && row.app.userId !== session.userId) {
    return fail("Forbidden", 403);
  }

  // Fetch installments + payments + delivery
  const [installments, payments, deliveries, asset] = await Promise.all([
    db
      .select()
      .from(schema.installments)
      .where(eq(schema.installments.applicationId, id))
      .orderBy(schema.installments.sequence),
    db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.applicationId, id)),
    db
      .select()
      .from(schema.deliveries)
      .where(eq(schema.deliveries.applicationId, id)),
    db
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.applicationId, id))
      .limit(1),
  ]);

  return ok({
    application: row.app,
    product: row.product,
    user: isAdmin(session.role) ? row.user : { id: row.user?.id, name: row.user?.name },
    risk: row.risk,
    installments,
    payments,
    deliveries,
    asset: asset[0] ?? null,
  });
});
