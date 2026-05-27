import { db, schema } from "@/db";
import { desc, like, eq, or } from "drizzle-orm";
import { ADMIN_ROLES_LIST, ok, requireAuth } from "@/lib/api";
import type { NextRequest } from "next/server";

export const GET = await requireAuth(ADMIN_ROLES_LIST)(async (
  req: NextRequest
) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const action = url.searchParams.get("action");

  let query = db
    .select({
      log: schema.auditLogs,
      actor: { id: schema.users.id, name: schema.users.name, role: schema.users.role },
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.auditLogs.actorId, schema.users.id))
    .orderBy(desc(schema.auditLogs.createdAt))
    .$dynamic();

  if (q) {
    query = query.where(
      or(
        like(schema.auditLogs.action, `%${q}%`),
        like(schema.auditLogs.entityId, `%${q}%`),
        like(schema.users.name, `%${q}%`)
      )!
    );
  }
  if (action) {
    query = query.where(like(schema.auditLogs.action, `${action}%`));
  }

  const items = await query.limit(500);
  return ok({ items });
});
