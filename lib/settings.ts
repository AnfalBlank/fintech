// Centralized app settings stored in `settings` table (key/value JSON).
// Falls back to defaults if not present in DB.

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export type AppSettings = {
  // Margin %
  margin3m: number;
  margin6m: number;
  margin12m: number;
  // L3 priority discount %
  marginL3Discount: number;
  // Limits per trust level
  limitL1: number;
  limitL2: number;
  limitL3: number;
  // DP %
  dpUnder5: number;
  dpUnder10: number;
  dpOver10: number;
  // Operational
  noDpThreshold: number;
  maxAffordablePct: number; // 0..1
  otpTtlMinutes: number;
  paymentExpireHours: number;
  penaltyDailyPct: number; // 0..1, default 0.001
  // Coverage
  coverageCities: string[];
  // Marketplace whitelist
  allowedMarketplaces: string[];
};

const DEFAULTS: AppSettings = {
  margin3m: 0.3,
  margin6m: 0.33,
  margin12m: 0.38,
  marginL3Discount: 0.03,
  limitL1: 3_000_000,
  limitL2: 5_000_000,
  limitL3: 25_000_000,
  dpUnder5: 0.1,
  dpUnder10: 0.2,
  dpOver10: 0.3,
  noDpThreshold: 3_000_000,
  maxAffordablePct: 0.35,
  otpTtlMinutes: 5,
  paymentExpireHours: 24,
  penaltyDailyPct: 0.001,
  coverageCities: ["Jakarta", "Depok", "Tangerang", "Bogor", "Bekasi", "Bandung"],
  allowedMarketplaces: ["tokopedia", "shopee", "tiktok_shop", "lazada"],
};

const KEY = "app";

let cached: { at: number; value: AppSettings } | null = null;
const TTL = 60_000; // 1 minute in-process cache

export async function loadSettings(): Promise<AppSettings> {
  if (cached && Date.now() - cached.at < TTL) return cached.value;
  const row = (
    await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, KEY))
      .limit(1)
  )[0];
  let value = DEFAULTS;
  if (row?.value) {
    try {
      value = { ...DEFAULTS, ...(JSON.parse(row.value) as Partial<AppSettings>) };
    } catch {
      value = DEFAULTS;
    }
  }
  cached = { at: Date.now(), value };
  return value;
}

export async function saveSettings(
  patch: Partial<AppSettings>,
  updatedBy: string
): Promise<AppSettings> {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  const row = (
    await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, KEY))
      .limit(1)
  )[0];
  if (row) {
    await db
      .update(schema.settings)
      .set({
        value: JSON.stringify(next),
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.settings.key, KEY));
  } else {
    await db.insert(schema.settings).values({
      key: KEY,
      value: JSON.stringify(next),
      updatedBy,
    });
  }
  cached = { at: Date.now(), value: next };
  return next;
}

export function defaultSettings(): AppSettings {
  return DEFAULTS;
}
