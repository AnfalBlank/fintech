// Liveness + readiness check.
// Returns 200 with DB ping status. Useful for load balancers / uptime probes.
import { db, schema } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatencyMs = -1;
  try {
    const t = Date.now();
    await db
      .select({ ok: sql<number>`1` })
      .from(schema.users)
      .limit(1);
    dbLatencyMs = Date.now() - t;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? "ok" : "degraded";
  const httpStatus = dbOk ? 200 : 503;

  return new Response(
    JSON.stringify({
      status,
      uptime: Math.round(process.uptime?.() ?? 0),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
      db: { ok: dbOk, latencyMs: dbLatencyMs },
      generatedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    }),
    {
      status: httpStatus,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    }
  );
}
