import { db, schema } from "@/db";
import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit, notify } from "@/lib/services";
import { newId } from "@/lib/ids";
import type { NextRequest } from "next/server";

const ROLES = ["super_admin", "finance_admin", "collection_team"] as const;

export const GET = await requireAuth(ROLES)(async () => {
  const items = await db
    .select({
      b: schema.broadcasts,
      sender: { id: schema.users.id, name: schema.users.name },
    })
    .from(schema.broadcasts)
    .leftJoin(schema.users, eq(schema.broadcasts.sentBy, schema.users.id))
    .orderBy(desc(schema.broadcasts.createdAt))
    .limit(100);
  return ok({ items });
});

const Body = z.object({
  channel: z.enum(["wa", "email", "push"]),
  segment: z.enum(["all", "trust_1", "trust_2", "trust_3", "overdue", "active", "inactive"]),
  subject: z.string().optional(),
  message: z.string().min(5),
});

export const POST = await requireAuth(ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { channel, segment, subject, message } = parsed.data;

  // Resolve recipients per segment
  let recipientIds: string[] = [];
  if (segment === "all") {
    recipientIds = (
      await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "customer"))
    ).map((u) => u.id);
  } else if (segment.startsWith("trust_")) {
    const lvl = Number(segment.split("_")[1]);
    recipientIds = (
      await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.role, "customer"),
            eq(schema.users.trustLevel, lvl)
          )!
        )
    ).map((u) => u.id);
  } else if (segment === "overdue") {
    recipientIds = (
      await db
        .selectDistinct({ id: schema.installments.userId })
        .from(schema.installments)
        .where(eq(schema.installments.status, "overdue"))
    ).map((u) => u.id);
  } else if (segment === "active") {
    recipientIds = (
      await db
        .selectDistinct({ id: schema.applications.userId })
        .from(schema.applications)
        .where(eq(schema.applications.status, "active"))
    ).map((u) => u.id);
  } else if (segment === "inactive") {
    recipientIds = (
      await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "customer"))
    ).map((u) => u.id);
    // Subtract those with active applications
    const activeIds = (
      await db
        .selectDistinct({ id: schema.applications.userId })
        .from(schema.applications)
        .where(eq(schema.applications.status, "active"))
    ).map((u) => u.id);
    recipientIds = recipientIds.filter((x) => !activeIds.includes(x));
  }

  // Insert broadcast record
  const id = newId("BRD");
  await db.insert(schema.broadcasts).values({
    id,
    channel,
    segment,
    subject: subject ?? null,
    message,
    recipientCount: recipientIds.length,
    sentBy: session.userId,
  });

  // Generate in-app notifications for each recipient.
  // (Real WA/email delivery would use Twilio/Resend; we log the intent.)
  for (const userId of recipientIds) {
    await notify({
      userId,
      type: "system",
      tone: "info",
      title: subject ?? "Pengumuman Manggala",
      body: message,
    });
  }

  await audit(session.userId, "broadcast.send", "broadcasts", id, {
    channel,
    segment,
    count: recipientIds.length,
  });

  return ok({ id, recipientCount: recipientIds.length });
});
