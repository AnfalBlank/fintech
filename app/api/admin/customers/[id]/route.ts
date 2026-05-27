import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  ADMIN_ROLES_LIST,
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit } from "@/lib/services";
import { newId } from "@/lib/ids";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async (
  _req: NextRequest,
  { params }
) => {
  const id = params?.id;
  if (!id) return fail("ID required", 400);

  const user = (
    await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)
  )[0];
  if (!user) return fail("Tidak ditemukan", 404);

  const [apps, installments, payments, devicesRows, fraudRows, blacklistRows] =
    await Promise.all([
      db
        .select({ app: schema.applications, product: schema.products })
        .from(schema.applications)
        .leftJoin(
          schema.products,
          eq(schema.applications.productId, schema.products.id)
        )
        .where(eq(schema.applications.userId, id))
        .orderBy(desc(schema.applications.submittedAt)),
      db
        .select()
        .from(schema.installments)
        .where(eq(schema.installments.userId, id))
        .orderBy(desc(schema.installments.dueDate)),
      db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.userId, id))
        .orderBy(desc(schema.payments.createdAt)),
      db
        .select()
        .from(schema.devices)
        .where(eq(schema.devices.userId, id))
        .orderBy(desc(schema.devices.createdAt)),
      db
        .select()
        .from(schema.fraudLogs)
        .where(eq(schema.fraudLogs.userId, id))
        .orderBy(desc(schema.fraudLogs.detectedAt)),
      db
        .select()
        .from(schema.blacklists)
        .where(eq(schema.blacklists.userId, id)),
    ]);

  return ok({
    user,
    applications: apps,
    installments,
    payments,
    devices: devicesRows,
    fraud: fraudRows,
    blacklist: blacklistRows,
  });
});

const Patch = z.object({
  trustLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  limit: z.number().int().positive().optional(),
  status: z.enum(["active", "suspended", "blacklisted"]).optional(),
  reason: z.string().optional(),
});

export const PATCH = await requireAuth(["super_admin", "finance_admin"] as const)(
  async (req: NextRequest, { params, session }) => {
    const id = params?.id;
    if (!id) return fail("ID required", 400);
    const parsed = await parseJson(req, Patch);
    if (!parsed.ok) return fail(parsed.error, 400);
    const { reason, ...patch } = parsed.data;

    if (Object.keys(patch).length === 0) return fail("Tidak ada perubahan", 400);

    await db
      .update(schema.users)
      .set(patch)
      .where(eq(schema.users.id, id));

    if (parsed.data.status === "blacklisted") {
      await db.insert(schema.blacklists).values({
        id: newId("BLK"),
        userId: id,
        reason: reason ?? "manual blacklist",
        addedBy: session.userId,
      });
    }

    await audit(session.userId, "customer.update", "users", id, parsed.data);
    return ok({ updated: true });
  }
);
