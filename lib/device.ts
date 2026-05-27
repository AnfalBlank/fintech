// Device fingerprinting + binding (PRD §11 Step 1 + §17).
//
// Fingerprint = SHA-256 of (UA, Accept-Language, IP class, ...). For pure
// frontend fingerprint use FingerprintJS, but at the edge level the UA + IP
// gives enough trust signal for MVP.

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { and, eq, ne, count } from "drizzle-orm";
import { newId } from "./ids";
import { fraudId } from "./ids";

export function deviceFingerprint(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? "";
  const lang = req.headers.get("accept-language") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const ipClass = ip.split(".").slice(0, 3).join(".");
  return createHash("sha256")
    .update([ua, lang, ipClass].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

// Bind device to user — also detects multi-account fraud (same device → many users).
export async function bindDevice(
  userId: string,
  req: NextRequest
): Promise<{ deviceId: string; flagged: boolean }> {
  const fp = deviceFingerprint(req);
  const ua = req.headers.get("user-agent") ?? "";
  const ip = clientIp(req);

  // Find existing record for this (user, fingerprint).
  const existing = (
    await db
      .select()
      .from(schema.devices)
      .where(
        and(
          eq(schema.devices.userId, userId),
          eq(schema.devices.fingerprint, fp)
        )!
      )
      .limit(1)
  )[0];

  let deviceId: string;
  if (existing) {
    deviceId = existing.id;
  } else {
    deviceId = newId("DEV");
    await db.insert(schema.devices).values({
      id: deviceId,
      userId,
      fingerprint: fp,
      userAgent: ua,
      ipAddress: ip,
      name: ua.slice(0, 60),
      trustScore: 60,
    });
  }

  // Detect multi-account: same fingerprint with 2+ distinct users.
  const otherUsers = await db
    .select({ userId: schema.devices.userId })
    .from(schema.devices)
    .where(
      and(
        eq(schema.devices.fingerprint, fp),
        ne(schema.devices.userId, userId)
      )!
    );

  let flagged = false;
  if (otherUsers.length >= 1) {
    flagged = true;
    // Insert fraud log if not duplicated within last hour
    await db.insert(schema.fraudLogs).values({
      id: fraudId(),
      userId,
      deviceId,
      reason: `Multiple accounts on same device (${otherUsers.length + 1} akun)`,
      severity: otherUsers.length >= 2 ? "high" : "medium",
      status: "open",
    });
  }

  return { deviceId, flagged };
}
