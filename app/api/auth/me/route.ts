import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fail, ok } from "@/lib/api";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return fail("Unauthorized", 401);
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);
  const user = rows[0];
  if (!user) return fail("User tidak ditemukan", 404);
  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      trustLevel: user.trustLevel,
      limit: user.limit,
      city: user.city,
      occupation: user.occupation,
      income: user.income,
      status: user.status,
    },
  });
}
