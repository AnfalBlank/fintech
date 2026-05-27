import { db, schema } from "@/db";
import { eq, sql, desc, and, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  COLLECTION_ROLES,
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit, notify, syncOverdue } from "@/lib/services";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(COLLECTION_ROLES)(async () => {
  await syncOverdue();
  const items = await db
    .select({
      i: schema.installments,
      user: {
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
        city: schema.users.city,
      },
    })
    .from(schema.installments)
    .leftJoin(schema.users, eq(schema.installments.userId, schema.users.id))
    .where(eq(schema.installments.status, "overdue"))
    .orderBy(desc(schema.installments.dueDate));
  return ok({ items });
});

const ReminderBody = z.object({
  installmentIds: z.array(z.string()).min(1),
  channel: z.enum(["wa", "email", "push"]),
  message: z.string().optional(),
});

export const POST = await requireAuth(COLLECTION_ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, ReminderBody);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { installmentIds, channel, message } = parsed.data;
  const inss = await db
    .select()
    .from(schema.installments)
    .where(inArray(schema.installments.id, installmentIds));

  for (const i of inss) {
    await notify({
      userId: i.userId,
      type: "payment_reminder",
      tone: "warning",
      title: "Reminder cicilan",
      body:
        message ??
        `Cicilan Anda telah jatuh tempo. Mohon segera lakukan pembayaran.`,
    });
  }
  await audit(session.userId, "collection.reminder", "installments", undefined, {
    channel,
    count: inss.length,
  });
  return ok({ sent: inss.length, channel });
});
