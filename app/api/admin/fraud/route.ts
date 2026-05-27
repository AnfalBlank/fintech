import { db, schema } from "@/db";
import { eq, desc, ne } from "drizzle-orm";
import { z } from "zod";
import {
  ADMIN_ROLES_LIST,
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit } from "@/lib/services";
import { fraudId, newId } from "@/lib/ids";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async () => {
  const items = await db
    .select({
      f: schema.fraudLogs,
      user: { id: schema.users.id, name: schema.users.name },
    })
    .from(schema.fraudLogs)
    .leftJoin(schema.users, eq(schema.fraudLogs.userId, schema.users.id))
    .where(ne(schema.fraudLogs.status, "false_positive"))
    .orderBy(desc(schema.fraudLogs.detectedAt));
  return ok({ items });
});

const ActionBody = z.object({
  fraudId: z.string(),
  action: z.enum(["review", "block", "false_positive"]),
  notes: z.string().optional(),
});

export const POST = await requireAuth(["super_admin", "finance_admin", "surveyor"] as const)(
  async (req: NextRequest, { session }) => {
    const parsed = await parseJson(req, ActionBody);
    if (!parsed.ok) return fail(parsed.error, 400);
    const { fraudId, action, notes } = parsed.data;
    const now = new Date();
    const newStatus =
      action === "block"
        ? "blocked"
        : action === "false_positive"
          ? "false_positive"
          : "reviewed";
    await db
      .update(schema.fraudLogs)
      .set({ status: newStatus, resolvedBy: session.userId, resolvedAt: now })
      .where(eq(schema.fraudLogs.id, fraudId));

    if (action === "block") {
      const f = (
        await db
          .select()
          .from(schema.fraudLogs)
          .where(eq(schema.fraudLogs.id, fraudId))
          .limit(1)
      )[0];
      if (f?.userId) {
        await db
          .update(schema.users)
          .set({ status: "blacklisted" })
          .where(eq(schema.users.id, f.userId));
        await db.insert(schema.blacklists).values({
          id: newId("BLK"),
          userId: f.userId,
          reason: notes ?? "fraud-blocked",
          addedBy: session.userId,
        });
      }
    }
    await audit(session.userId, `fraud.${action}`, "fraud_logs", fraudId);
    return ok({ done: true });
  }
);
