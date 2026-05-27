import { db, schema } from "@/db";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { fail, ok, parseJson } from "@/lib/api";
import { userId, newOtp, newId } from "@/lib/ids";
import { audit, notify } from "@/lib/services";
import { bindDevice } from "@/lib/device";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const Body = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6).optional(),
  consentTnc: z.boolean(),
  consentData: z.boolean(),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400, parsed.details);
  const { name, email, phone, password, consentTnc, consentData } = parsed.data;

  if (!consentTnc || !consentData) {
    return fail("Persetujuan T&C dan data wajib", 400);
  }

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(or(eq(schema.users.email, email), eq(schema.users.phone, phone)))
    .limit(1);
  if (existing.length) return fail("Email atau nomor HP sudah terdaftar", 409);

  const id = userId();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  await db.insert(schema.users).values({
    id,
    name,
    email,
    phone,
    passwordHash,
    consentTnc,
    consentData,
    role: "customer",
    trustLevel: 1,
    limit: 3_000_000,
  });

  // Issue OTP for phone verification.
  const code = newOtp();
  await db.insert(schema.otps).values({
    id: newId("OTP"),
    phone,
    code,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await audit(id, "user.register", "users", id, { email, phone });
  await bindDevice(id, req);

  // Issue session immediately (post-OTP would also be fine).
  const token = await createSession({
    userId: id,
    role: "customer",
    name,
    trustLevel: 1,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  await notify({
    userId: id,
    type: "system",
    tone: "info",
    title: "Selamat datang di Manggala",
    body: "Akun Anda telah dibuat. Verifikasi nomor HP untuk lanjut.",
  });

  return ok({
    user: { id, name, email, phone, role: "customer", trustLevel: 1 },
    otp: process.env.NODE_ENV === "production" ? undefined : code,
  });
}
