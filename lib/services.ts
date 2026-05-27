import { db, schema } from "@/db";
import { newId, notificationId } from "./ids";
import { eq } from "drizzle-orm";

// PRD §21 — audit logs for sensitive admin actions.
export async function audit(
  actorId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
) {
  await db.insert(schema.auditLogs).values({
    id: newId("AUD"),
    actorId,
    action,
    entity: entity ?? null,
    entityId: entityId ?? null,
    metadata: metadata ? JSON.stringify(metadata) : null,
    ipAddress: ipAddress ?? null,
  });
}

// PRD §13-§14 — notifications.
export async function notify(input: {
  userId: string;
  type:
    | "approval_update"
    | "delivery_update"
    | "payment_reminder"
    | "payment_success"
    | "fraud_alert"
    | "system";
  tone?: "success" | "info" | "warning" | "danger";
  title: string;
  body?: string;
  link?: string;
}) {
  await db.insert(schema.notifications).values({
    id: notificationId(),
    userId: input.userId,
    type: input.type,
    tone: input.tone ?? "info",
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });
}

// PRD §11 — generate installment schedule after approval & DP confirmed.
export async function generateInstallmentSchedule(
  applicationId: string,
  userId: string,
  monthly: number,
  tenor: number,
  startDate: Date = new Date()
) {
  const rows = [];
  for (let i = 0; i < tenor; i++) {
    const due = new Date(startDate);
    due.setMonth(due.getMonth() + i + 1);
    rows.push({
      id: newId("INS"),
      applicationId,
      userId,
      sequence: i + 1,
      amount: monthly,
      dueDate: due,
      status: "upcoming" as const,
      penaltyAmount: 0,
    });
  }
  if (rows.length) await db.insert(schema.installments).values(rows);
  return rows;
}

// Update overdue installments — called from cron or on read.
export async function syncOverdue(): Promise<number> {
  const now = new Date();
  const upcoming = await db
    .select()
    .from(schema.installments)
    .where(eq(schema.installments.status, "upcoming"));
  let n = 0;
  for (const i of upcoming) {
    if (i.dueDate.getTime() < now.getTime()) {
      const days = Math.floor(
        (now.getTime() - i.dueDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      const penalty = Math.floor(i.amount * 0.001) * days; // 0.1% per day
      await db
        .update(schema.installments)
        .set({ status: "overdue", penaltyAmount: penalty })
        .where(eq(schema.installments.id, i.id));
      n++;
    }
  }
  return n;
}
