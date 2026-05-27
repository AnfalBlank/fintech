import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  DELIVERY_ROLES,
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit, notify } from "@/lib/services";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(DELIVERY_ROLES)(async () => {
  const items = await db
    .select({
      d: schema.deliveries,
      app: schema.applications,
      product: schema.products,
      courier: { id: schema.users.id, name: schema.users.name },
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
    .leftJoin(schema.users, eq(schema.deliveries.courierId, schema.users.id))
    .orderBy(desc(schema.deliveries.scheduledAt));
  return ok({ items });
});

const AssignBody = z.object({
  deliveryId: z.string(),
  courierId: z.string(),
  scheduledAt: z.string().datetime().optional(),
});

export const POST = await requireAuth(DELIVERY_ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, AssignBody);
  if (!parsed.ok) return fail(parsed.error, 400);
  const updates: Record<string, unknown> = {
    courierId: parsed.data.courierId,
    status: "assigned",
  };
  if (parsed.data.scheduledAt)
    updates.scheduledAt = new Date(parsed.data.scheduledAt);
  await db
    .update(schema.deliveries)
    .set(updates)
    .where(eq(schema.deliveries.id, parsed.data.deliveryId));
  await audit(
    session.userId,
    "delivery.assign",
    "deliveries",
    parsed.data.deliveryId,
    { courier: parsed.data.courierId }
  );
  return ok({ assigned: true });
});
