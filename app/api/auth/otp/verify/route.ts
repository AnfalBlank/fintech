import { db, schema } from "@/db";
import { and, eq, isNull, gt, desc } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, parseJson } from "@/lib/api";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { audit } from "@/lib/services";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const Body = z.object({
  phone: z.string().min(8),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { phone, code } = parsed.data;

  const now = new Date();
  const rows = await db
    .select()
    .from(schema.otps)
    .where(
      and(
        eq(schema.otps.phone, phone),
        eq(schema.otps.code, code),
        isNull(schema.otps.usedAt),
        gt(schema.otps.expiresAt, now)
      )
    )
    .orderBy(desc(schema.otps.createdAt))
    .limit(1);

  if (rows.length === 0) return fail("Kode OTP salah atau kedaluwarsa", 400);

  await db
    .update(schema.otps)
    .set({ usedAt: now })
    .where(eq(schema.otps.id, rows[0].id));

  // Find/upsert user
  let user = (
    await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.phone, phone))
      .limit(1)
  )[0];

  if (!user) return fail("User tidak ditemukan, daftar dulu", 404);

  await db
    .update(schema.users)
    .set({ phoneVerified: true, lastLoginAt: now })
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

  await audit(user.id, "user.login.otp", "users", user.id);

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
