import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { ADMIN_ROLES_LIST, ok, requireAuth } from "@/lib/api";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async (
  req: NextRequest
) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  let q = db
    .select({
      a: schema.assets,
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
    .orderBy(desc(schema.assets.createdAt))
    .$dynamic();
  if (status) q = q.where(eq(schema.assets.status, status as any));
  const items = await q;
  return ok({ items });
});
