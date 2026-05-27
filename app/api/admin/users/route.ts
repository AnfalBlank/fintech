import { db, schema } from "@/db";
import { eq, ne } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { userId as newUserId } from "@/lib/ids";
import { audit } from "@/lib/services";
import type { NextRequest } from "next/server";

const SUPER = ["super_admin"] as const;

export const GET = await requireAuth(SUPER)(async () => {
  const items = await db
    .select()
    .from(schema.users)
    .where(ne(schema.users.role, "customer"));
  return ok({ items });
});

const CreateBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  role: z.enum([
    "super_admin",
    "finance_admin",
    "collection_team",
    "delivery_team",
    "surveyor",
    "courier",
  ]),
});

export const POST = await requireAuth(SUPER)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, CreateBody);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { name, email, phone, password, role } = parsed.data;
  const id = newUserId();
  const hash = await bcrypt.hash(password, 10);
  await db.insert(schema.users).values({
    id,
    name,
    email,
    phone,
    passwordHash: hash,
    role,
    consentTnc: true,
    consentData: true,
    emailVerified: true,
    phoneVerified: true,
  });
  await audit(session.userId, "user.create", "users", id, { role });
  return ok({ id, name, email, role });
});

const UpdateBody = z.object({
  userId: z.string(),
  role: z
    .enum([
      "super_admin",
      "finance_admin",
      "collection_team",
      "delivery_team",
      "surveyor",
      "courier",
      "customer",
    ])
    .optional(),
  status: z.enum(["active", "suspended", "blacklisted"]).optional(),
});

export const PATCH = await requireAuth(SUPER)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, UpdateBody);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { userId, ...rest } = parsed.data;
  await db.update(schema.users).set(rest).where(eq(schema.users.id, userId));
  await audit(session.userId, "user.update", "users", userId, rest);
  return ok({ updated: true });
});
