import { db, schema } from "@/db";
import { z } from "zod";
import { fail, ok, parseJson } from "@/lib/api";
import { newId, newOtp } from "@/lib/ids";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

const Body = z.object({ phone: z.string().min(8) });

export async function POST(req: NextRequest) {
  // 5 OTP requests per phone per 10 minutes (resists SMS bombing).
  const parsedRaw = await req
    .clone()
    .json()
    .catch(() => ({}) as { phone?: string });
  const phoneId = parsedRaw?.phone ?? "unknown";
  const limited = await enforceRateLimit(req, "otp-request", {
    limit: 5,
    windowMs: 10 * 60 * 1000,
    identifier: phoneId,
  });
  if (limited) return limited;

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
