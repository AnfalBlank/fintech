// Lightweight rate limiter with in-memory fallback and Upstash Redis backend
// when UPSTASH_REDIS_REST_URL is configured. Designed to be drop-in for
// Route Handlers — call `enforceRateLimit(req, key, limit)` at the top of
// any sensitive endpoint.
//
// In production set:
//   UPSTASH_REDIS_REST_URL=https://...
//   UPSTASH_REDIS_REST_TOKEN=...
// to switch to distributed counters. Without these, falls back to per-process
// in-memory counters (useful for single-instance deploys / dev).

import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
const useUpstash = !!UPSTASH_URL && !!UPSTASH_TOKEN;

async function upstash(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return (await res.json()).result;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  if (useUpstash) {
    try {
      const ttlSec = Math.ceil(windowMs / 1000);
      const count = (await upstash(["INCR", key])) as number;
      if (count === 1) {
        await upstash(["EXPIRE", key, ttlSec]);
      }
      const ttl = (await upstash(["TTL", key])) as number;
      const resetAt = now + Math.max(0, ttl) * 1000;
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt,
      };
    } catch {
      // fall through to memory
    }
  }
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

// Convenience wrapper that throws a 429 Response when over limit.
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  opts: { limit: number; windowMs: number; identifier?: string }
): Promise<Response | null> {
  const ip = getClientIp(req);
  const id = opts.identifier ?? ip;
  const key = `rl:${scope}:${id}`;
  const result = await rateLimit(key, opts.limit, opts.windowMs);
  if (!result.ok) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Terlalu banyak request, coba lagi sebentar.",
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retryAfter),
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(result.resetAt),
        },
      }
    );
  }
  return null;
}
