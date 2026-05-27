import { db, schema } from "@/db";
import { z } from "zod";
import { fail, ok, parseJson } from "@/lib/api";
import { newId, newOtp } from "@/lib/ids";
import type { NextRequest } from "next/server";

const Body = z.object({ phone: z.string().min(8) });

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const code = newOtp();
  await db.insert(schema.otps).values({
    id: newId("OTP"),
    phone: parsed.data.phone,
    code,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  return ok({
    sent: true,
    // Dev only: return code so QA can test without SMS provider.
    otp: process.env.NODE_ENV === "production" ? undefined : code,
  });
}
