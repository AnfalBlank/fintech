import { db, schema } from "@/db";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { fail, ok, parseJson } from "@/lib/api";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { audit } from "@/lib/services";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const Body = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(4),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { identifier, password } = parsed.data;

  const rows = await db
    .select()
    .from(schema.users)
    .where(
      or(
        eq(schema.users.email, identifier),
        eq(schema.users.phone, identifier)
      )
    )
    .limit(1);

  const user = rows[0];
  if (!user || !user.passwordHash) {
    return fail("Akun tidak ditemukan atau hanya bisa login dengan OTP", 401);
  }
  if (user.status !== "active") {
    return fail("Akun di-suspend atau di-blacklist", 403);
  }
  const ok2 = await bcrypt.compare(password, user.passwordHash);
  if (!ok2) return fail("Password salah", 401);

  const now = new Date();
  await db
    .update(schema.users)
    .set({ lastLoginAt: now })
    .where(eq(schema.users.id, user.id));

  const token = await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    trustLevel: user.trustLevel,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  await audit(user.id, "user.login.password", "users", user.id);

  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      trustLevel: user.trustLevel,
    },
  });
}
