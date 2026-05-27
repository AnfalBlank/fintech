import { z } from "zod";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { defaultSettings, loadSettings, saveSettings } from "@/lib/settings";
import { audit } from "@/lib/services";
import type { NextRequest } from "next/server";

const ROLES = ["super_admin"] as const;

export const GET = await requireAuth(ROLES)(async () => {
  const settings = await loadSettings();
  return ok({ settings, defaults: defaultSettings() });
});

const Patch = z.object({
  margin3m: z.number().min(0).max(2).optional(),
  margin6m: z.number().min(0).max(2).optional(),
  margin12m: z.number().min(0).max(2).optional(),
  marginL3Discount: z.number().min(0).max(0.5).optional(),
  limitL1: z.number().int().positive().optional(),
  limitL2: z.number().int().positive().optional(),
  limitL3: z.number().int().positive().optional(),
  dpUnder5: z.number().min(0).max(1).optional(),
  dpUnder10: z.number().min(0).max(1).optional(),
  dpOver10: z.number().min(0).max(1).optional(),
  noDpThreshold: z.number().int().positive().optional(),
  maxAffordablePct: z.number().min(0).max(1).optional(),
  otpTtlMinutes: z.number().int().min(1).max(60).optional(),
  paymentExpireHours: z.number().int().min(1).max(168).optional(),
  penaltyDailyPct: z.number().min(0).max(0.1).optional(),
  coverageCities: z.array(z.string()).optional(),
  allowedMarketplaces: z.array(z.string()).optional(),
});

export const PATCH = await requireAuth(ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Patch);
  if (!parsed.ok) return fail(parsed.error, 400);
  const next = await saveSettings(parsed.data, session.userId);
  await audit(session.userId, "settings.update", "settings", "app", parsed.data);
  return ok({ settings: next });
});
