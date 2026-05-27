import { db, schema } from "@/db";
import { eq, desc, isNull, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import type { NextRequest } from "next/server";

export const GET = await requireAuth()(async (
  _req: NextRequest,
  { session }
) => {
  const items = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, session.userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(50);
  return ok({ items });
});

const Body = z.object({ ids: z.array(z.string()).optional() });

export const PATCH = await requireAuth()(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const now = new Date();
  if (parsed.data.ids?.length) {
    await db
      .update(schema.notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(schema.notifications.userId, session.userId),
          inArray(schema.notifications.id, parsed.data.ids)
        )!
      );
  } else {
    await db
      .update(schema.notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(schema.notifications.userId, session.userId),
          isNull(schema.notifications.readAt)
        )!
      );
  }
  return ok({ updated: true });
});
